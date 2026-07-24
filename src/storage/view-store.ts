export const savedViews = ['new', 'reports', 'demo', 'profile', 'privacy', 'terms', 'pricing', 'offer', 'contacts'] as const;
export type SavedView = typeof savedViews[number];
const key = 'clientlens-last-view-v1';
export const isSavedView = (value: string | null): value is SavedView => savedViews.includes(value as SavedView);
export const getSavedView = (): SavedView => { try { const value = localStorage.getItem(key); return isSavedView(value) ? value : 'new'; } catch { return 'new'; } };
export const saveView = (view: SavedView): void => { try { localStorage.setItem(key, view); } catch { /* browser storage unavailable */ } };
