import type { Express, RequestHandler } from 'express';
import express from 'express';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const isProduction = (nodeEnv = process.env.NODE_ENV): boolean => nodeEnv === 'production';

export function serveProductionFiles(app: Express, distDirectory = resolve(process.cwd(), 'dist')): void {
  if (!existsSync(distDirectory)) throw new Error('Production build is missing. Run npm run build before npm run start.');
  app.use(express.static(distDirectory));
  const indexFile = resolve(distDirectory, 'index.html');
  const serveSpa: RequestHandler = (request, response, next) => {
    if (request.path === '/api' || request.path.startsWith('/api/')) return next();
    return response.sendFile(indexFile);
  };
  app.use(serveSpa);
}
