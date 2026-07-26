export const withAvatarCacheBust = (url: string, version: string | number = Date.now()): string => {
  if (!url) return '';
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(version))}`;
};
