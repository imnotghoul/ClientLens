const keyFor = (userId: string) => `clientlens-free-quick-luna-v1:${userId}`;

export function shouldConsumeFreeQuickLuna(request: { mode: string; model: string }, responseMode: 'ai' | 'basic'): boolean {
  return request.mode === 'quick' && request.model === 'gpt-5.6-luna' && responseMode === 'ai';
}

export function hasUsedFreeQuickLuna(userId: string): boolean {
  try {
    return localStorage.getItem(keyFor(userId)) === 'used';
  } catch {
    return true;
  }
}

export function markFreeQuickLunaUsed(userId: string): void {
  try {
    localStorage.setItem(keyFor(userId), 'used');
  } catch {
    // The entitlement remains unavailable when its usage cannot be persisted.
  }
}
