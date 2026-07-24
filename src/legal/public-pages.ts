export type PublicPage = 'pricing' | 'offer' | 'contacts';

const paths: Record<PublicPage, string> = {
  pricing: '/pricing',
  offer: '/offer',
  contacts: '/contacts',
};

export function publicPageFromPath(pathname: string): PublicPage | null {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return (Object.keys(paths) as PublicPage[]).find((page) => paths[page] === normalized) ?? null;
}

export function pathForPublicPage(page: PublicPage): string {
  return paths[page];
}
