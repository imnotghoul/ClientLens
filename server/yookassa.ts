import type { SupabaseClient } from '@supabase/supabase-js';
import type { Express, Request } from 'express';
import { extractBearerToken, requireAuthenticatedUser, verifySupabaseAccessToken } from './auth';
import { createServerSupabaseClient } from './supabase';

const YOOKASSA_API = 'https://api.yookassa.ru/v3';
const TOP_UP_AMOUNTS = new Set([100, 300, 500, 1000]);
type YooKassaResponse = { id?: string; status?: string; amount?: { value?: string }; confirmation?: { confirmation_url?: string }; metadata?: Record<string, string>; description?: string; created_at?: string };
type YooKassaListResponse = { items?: YooKassaResponse[] };
type PaymentCreditDetails = { paymentId: string; userId: string; amount: number };

export function parseTopUpAmount(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  return Number.isInteger(amount) && TOP_UP_AMOUNTS.has(amount) ? amount : null;
}

export function yookassaAuthHeader(shopId = process.env.YOOKASSA_SHOP_ID ?? '', secret = process.env.YOOKASSA_SECRET_KEY ?? ''): string {
  return `Basic ${Buffer.from(`${shopId}:${secret}`).toString('base64')}`;
}

export function paymentConfirmationUrl(): string {
  return process.env.YOOKASSA_RETURN_URL || 'https://clientlens.ru/';
}

export function paymentCreditDetails(payment: YooKassaResponse): PaymentCreditDetails | null {
  const paymentId = typeof payment.id === 'string' ? payment.id : '';
  const userId = typeof payment.metadata?.user_id === 'string' ? payment.metadata.user_id : '';
  const amount = Number(payment.amount?.value);
  if (payment.status !== 'succeeded' || !paymentId || !userId || !Number.isFinite(amount) || amount <= 0) return null;
  const supportedAmount = parseTopUpAmount(amount);
  return supportedAmount ? { paymentId, userId, amount: supportedAmount } : null;
}

function adminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return url && key ? createServerSupabaseClient(url, key) : null;
}

async function yookassaRequest<T extends YooKassaResponse | YooKassaListResponse = YooKassaResponse>(path: string, init?: RequestInit): Promise<T> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) throw new Error('ЮKassa не настроена на сервере.');
  const response = await fetch(`${YOOKASSA_API}${path}`, {
    ...init,
    headers: { Authorization: yookassaAuthHeader(shopId, secret), 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({})) as T;
  if (!response.ok) throw new Error(typeof body?.description === 'string' ? body.description : `YooKassa HTTP ${response.status}`);
  return body;
}

async function creditPayment(payment: YooKassaResponse, client: SupabaseClient): Promise<boolean> {
  const details = paymentCreditDetails(payment);
  if (!details) return false;
  const { error } = await client.rpc('credit_yookassa_payment', {
    p_payment_id: details.paymentId,
    p_user_id: details.userId,
    p_amount: details.amount,
  });
  if (error) throw error;
  return true;
}

async function savePendingPayment(payment: YooKassaResponse, userId: string, amount: number, client: SupabaseClient): Promise<void> {
  if (!payment.id) return;
  const { error } = await client.from('payment_orders').upsert({
    yookassa_payment_id: payment.id,
    user_id: userId,
    amount,
    status: 'pending',
  }, { onConflict: 'yookassa_payment_id', ignoreDuplicates: true });
  if (error) console.error('[wallet] failed to save pending payment', error.message);
}

async function authenticatedUser(request: Request): Promise<string | null> {
  const token = extractBearerToken(request.header('authorization'));
  return token ? requireAuthenticatedUser(token, verifySupabaseAccessToken) : null;
}

export function registerYookassaRoutes(app: Express): void {
  app.get('/api/wallet', async (request, response) => {
    const userId = await authenticatedUser(request);
    if (!userId) return response.status(401).json({ error: 'Войдите в аккаунт.' });
    const client = adminClient();
    if (!client) return response.status(503).json({ error: 'Баланс временно недоступен.' });
    const { data, error } = await client.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
    if (error) {
      console.error('[wallet] load failed', { userId, code: error.code, message: error.message, details: error.details, hint: error.hint });
      return response.status(500).json({ error: 'Не удалось загрузить баланс.' });
    }
    return response.json({ balance: Number(data?.balance ?? 0) });
  });

  app.post('/api/yookassa/create-payment', async (request, response) => {
    try {
      const userId = await authenticatedUser(request);
      if (!userId) return response.status(401).json({ error: 'Войдите в аккаунт.' });
      const amount = parseTopUpAmount(request.body?.amount);
      if (!amount) return response.status(400).json({ error: 'Выберите сумму пополнения.' });
      if (!adminClient()) return response.status(503).json({ error: 'Платежи пока не настроены.' });
      const payment = await yookassaRequest('/payments', {
        method: 'POST',
        headers: { 'Idempotence-Key': globalThis.crypto.randomUUID() },
        body: JSON.stringify({
          amount: { value: amount.toFixed(2), currency: 'RUB' },
          capture: true,
          confirmation: { type: 'redirect', return_url: paymentConfirmationUrl() },
          description: `Пополнение баланса ClientLens на ${amount} ₽`,
          metadata: { user_id: userId, amount_rub: String(amount) },
        }),
      });
      const client = adminClient();
      if (client) await savePendingPayment(payment, userId, amount, client);
      return response.json({ paymentId: payment.id, confirmationUrl: payment.confirmation?.confirmation_url });
    } catch (error) {
      return response.status(502).json({ error: error instanceof Error ? error.message : 'Не удалось создать платеж.' });
    }
  });

  app.post('/api/wallet/sync', async (request, response) => {
    try {
      const userId = await authenticatedUser(request);
      if (!userId) return response.status(401).json({ error: 'Войдите в аккаунт.' });
      const client = adminClient();
      if (!client) return response.status(503).json({ error: 'Баланс временно недоступен.' });

      const pending = await client.from('payment_orders').select('yookassa_payment_id').eq('user_id', userId).eq('status', 'pending').limit(20);
      const pendingIds = (pending.data ?? []).map((row: { yookassa_payment_id?: string }) => row.yookassa_payment_id).filter((id): id is string => Boolean(id));
      const candidates = new Map<string, YooKassaResponse>();
      for (const paymentId of pendingIds) {
        const payment = await yookassaRequest(`/payments/${encodeURIComponent(paymentId)}`);
        if (payment.id) candidates.set(payment.id, payment);
      }

      const listed = await yookassaRequest<YooKassaListResponse>('/payments?status=succeeded&limit=100');
      for (const payment of listed.items ?? []) {
        if (payment.id && payment.metadata?.user_id === userId) candidates.set(payment.id, payment);
      }

      let credited = 0;
      for (const payment of candidates.values()) {
        const details = paymentCreditDetails(payment);
        if (details?.userId === userId && await creditPayment(payment, client)) credited += details.amount;
      }

      const { data, error } = await client.from('wallets').select('balance').eq('user_id', userId).maybeSingle();
      if (error) {
        console.error('[wallet] sync load failed', { userId, code: error.code, message: error.message, details: error.details, hint: error.hint });
        return response.status(500).json({ error: 'Не удалось загрузить баланс.' });
      }
      return response.json({ balance: Number(data?.balance ?? 0), credited });
    } catch (error) {
      console.error('[wallet] sync failed', error);
      return response.status(502).json({ error: 'Не удалось синхронизировать платёж.' });
    }
  });

  app.post('/api/yookassa/webhook', async (request, response) => {
    try {
      const paymentId = typeof request.body?.object?.id === 'string' ? request.body.object.id : '';
      if (!paymentId) return response.status(400).json({ error: 'Некорректное уведомление.' });
      const payment = await yookassaRequest(`/payments/${encodeURIComponent(paymentId)}`);
      if (payment.status !== 'succeeded') return response.sendStatus(200);
      const userId = typeof payment.metadata?.user_id === 'string' ? payment.metadata.user_id : '';
      const amount = Number(payment.amount?.value);
      const client = adminClient();
      if (!client || !userId || !Number.isFinite(amount)) return response.status(503).json({ error: 'Сервис временно недоступен.' });
      const { error } = await client.rpc('credit_yookassa_payment', { p_payment_id: payment.id, p_user_id: userId, p_amount: amount });
      if (error) return response.status(500).json({ error: 'Не удалось зачислить платеж.' });
      return response.sendStatus(200);
    } catch {
      return response.status(502).json({ error: 'Не удалось проверить платеж.' });
    }
  });
}
