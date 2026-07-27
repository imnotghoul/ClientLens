import type { Express } from 'express';

export function configureTrustProxy(app: Express): void {
  app.set('trust proxy', 1);
}
