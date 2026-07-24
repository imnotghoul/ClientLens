import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { analyzeWithAi } from './ai';
import { extractBearerToken, requireAuthenticatedUser, verifySupabaseAccessToken } from './auth';
import { sanitizeProfile } from './input';
import { collectPublicProfile, platformLabel } from './profile-collection';
import { compareProfiles } from '../src/scoring/competitive-analysis';
import type { ProfileInput } from '../src/domain/profile';
import { isProduction, serveProductionFiles } from './production';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"],
  connectSrc: ["'self'", 'https://*.supabase.co'],
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
  objectSrc: ["'none'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
} } }));
app.use(express.json({ limit: '24kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }));
const analyzeLimit = rateLimit({ windowMs: 15 * 60_000, limit: 6, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Слишком много запросов на анализ. Попробуйте позже.' } });

const mergeProfile = (manual: ProfileInput, collected?: ProfileInput): ProfileInput => {
  if (!collected) return manual;
  return Object.fromEntries(Object.entries(collected).map(([key, value]) => [key, manual[key as keyof ProfileInput] || value])) as ProfileInput;
};

app.get('/api/health', (_request, response) => response.json({ ok: true }));
app.post('/api/analyze', analyzeLimit, async (request, response, next) => {
  try {
    const token = extractBearerToken(request.header('authorization'));
    const userId = token ? await requireAuthenticatedUser(token, verifySupabaseAccessToken) : null;
    if (!userId) return response.status(401).json({ error: 'Войдите в аккаунт, чтобы запустить анализ.' });
    const manual = sanitizeProfile(request.body?.profile ?? request.body);
    if (!manual) return response.status(400).json({ error: 'Добавьте ссылку или данные профиля для анализа.' });
    const collected = manual.profileUrl ? await collectPublicProfile(manual.profileUrl).catch(() => undefined) : undefined;
    const profile = mergeProfile(manual, collected?.profile);
    const model = ['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol'].includes(request.body?.model) ? request.body.model : undefined;
    const result = await analyzeWithAi(profile, { model, platform: platformLabel(collected?.platform) });
    const rawCompetitors = Array.isArray(request.body?.competitors) ? request.body.competitors.slice(0, 3) : [];
    const competitors = await Promise.all(rawCompetitors.map(async (item) => {
      const source = typeof item?.profileUrl === 'string' ? await collectPublicProfile(item.profileUrl).catch(() => undefined) : undefined;
      return mergeProfile({ name: String(item?.name ?? ''), title: String(item?.headline ?? ''), price: String(item?.price ?? ''), reviews: '', description: '', specialization: '', services: '', completedOrders: 0, portfolio: '', profileUrl: String(item?.profileUrl ?? ''), extra: '', goal: 'orders' }, source?.profile);
    }));
    if (competitors.length) result.audit.competitive = compareProfiles(profile, competitors);
    if (collected?.warnings.length) result.audit.missingDataWarnings = [...(result.audit.missingDataWarnings ?? []), ...collected.warnings];
    return response.json(result);
  } catch (error) { return next(error); }
});
if (isProduction()) serveProductionFiles(app);
app.use((_request, response) => response.status(404).json({ error: 'Маршрут не найден.' }));
app.use((_error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => { void next; return response.status(500).json({ error: 'Не удалось выполнить запрос. Попробуйте ещё раз.' }); });

const port = Number(process.env.PORT || 8787);
app.listen(port, '0.0.0.0', () => console.log(`API server: http://0.0.0.0:${port}`));
