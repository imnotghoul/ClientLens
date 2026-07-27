import express from 'express';
import { describe, expect, it } from 'vitest';
import { configureTrustProxy } from './proxy';

describe('reverse proxy configuration', () => {
  it('trusts exactly one proxy hop for forwarded client headers', () => {
    const app = express();

    configureTrustProxy(app);

    expect(app.get('trust proxy')).toBe(1);
  });
});
