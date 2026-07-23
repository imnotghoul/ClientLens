import { emptyProfile, type ProfileInput } from '../src/domain/profile';

export const MAX_FIELD_LENGTH = 1500;
const text = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, MAX_FIELD_LENGTH) : '';
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export function sanitizeProfile(value: unknown): ProfileInput | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const profile: ProfileInput = { ...emptyProfile, name: text(source.name), specialization: text(source.specialization), title: text(source.title), description: text(source.description), services: text(source.services), price: text(source.price), reviews: text(source.reviews), completedOrders: number(source.completedOrders), portfolio: text(source.portfolio), profileUrl: text(source.profileUrl), extra: text(source.extra), goal: ['orders', 'trust', 'price', 'impression', 'weaknesses'].includes(String(source.goal)) ? String(source.goal) as ProfileInput['goal'] : 'orders' };
  const hasContent = Object.entries(profile).some(([key, item]) => key !== 'goal' && (typeof item === 'number' ? item > 0 : item.length > 0));
  return hasContent ? profile : null;
}
