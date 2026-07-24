import { publicPageFromPath, type PublicPage } from './public-pages';

export type InitialView = 'new' | PublicPage;

export function initialViewFromPath(pathname: string): InitialView {
  return publicPageFromPath(pathname) ?? 'new';
}
