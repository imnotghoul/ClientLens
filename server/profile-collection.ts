import { emptyProfile, type ProfileInput } from '../src/domain/profile';

export type PlatformId = 'kwork' | 'flru' | 'freelanceRu';
export type CollectedProfile = { profile: ProfileInput; platform: PlatformId; sourceUrl: string; warnings: string[]; collectedFields: string[] };

const allowedHosts: Record<PlatformId, string[]> = {
  kwork: ['kwork.ru', 'www.kwork.ru'],
  flru: ['fl.ru', 'www.fl.ru'],
  freelanceRu: ['freelance.ru', 'www.freelance.ru'],
};

export function detectPlatform(value: string): PlatformId | null {
  try {
    const url = new URL(value);
    return (Object.entries(allowedHosts).find(([, hosts]) => hosts.includes(url.hostname.toLowerCase()))?.[0] as PlatformId | undefined) ?? null;
  } catch { return null; }
}

export function validatePublicProfileUrl(value: string): URL | null {
  if (value.length > 500) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !detectPlatform(url.toString())) return null;
    return url;
  } catch { return null; }
}

const clean = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500);
const pick = (html: string, patterns: RegExp[]) => {
  for (const pattern of patterns) { const found = html.match(pattern)?.[1]; if (found) return clean(found); }
  return '';
};
const meta = (html: string, key: string) => pick(html, [new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'), new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${key}["']`, 'i')]);

export function extractPublicProfile(html: string, sourceUrl: string, platform: PlatformId): CollectedProfile {
  const title = meta(html, 'og:title') || pick(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = meta(html, 'description') || meta(html, 'og:description');
  const profile: ProfileInput = { ...emptyProfile, profileUrl: sourceUrl, title, description, specialization: platform === 'kwork' ? 'Kwork' : platform === 'flru' ? 'FL.ru' : 'Freelance.ru' };
  const collectedFields = Object.entries(profile).filter(([key, value]) => key !== 'goal' && typeof value === 'string' && value.length > 0).map(([key]) => key);
  const warnings = description ? [] : ['Площадка не отдала описание профиля; заполните его вручную для более точного отчёта.'];
  return { profile, platform, sourceUrl, warnings, collectedFields };
}

export async function collectPublicProfile(sourceUrl: string): Promise<CollectedProfile> {
  const url = validatePublicProfileUrl(sourceUrl);
  const platform = url ? detectPlatform(url.toString()) : null;
  if (!url || !platform) throw new Error('Поддерживаются только публичные ссылки Kwork, FL.ru и Freelance.ru.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'manual', headers: { 'User-Agent': 'ClientLens profile analyzer/1.0 (+https://clientlens.ru)' } });
    if (!response.ok) throw new Error('Профиль временно недоступен для анализа.');
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > 1_000_000) throw new Error('Страница профиля слишком большая.');
    const html = (await response.text()).slice(0, 1_000_000);
    return extractPublicProfile(html, url.toString(), platform);
  } finally { clearTimeout(timeout); }
}
