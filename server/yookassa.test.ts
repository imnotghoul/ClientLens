import { describe, expect, it } from 'vitest';
import { parseTopUpAmount, paymentConfirmationUrl, yookassaAuthHeader } from './yookassa';

describe('yookassa helpers', () => {
  it('accepts only supported top-up amounts', () => {
    expect(parseTopUpAmount(100)).toBe(100);
    expect(parseTopUpAmount('500')).toBe(500);
    expect(parseTopUpAmount(99)).toBeNull();
    expect(parseTopUpAmount('100.5')).toBeNull();
  });

  it('builds basic auth without exposing the secret', () => {
    const header = yookassaAuthHeader('1417525', 'secret');
    expect(header).toBe(`Basic ${Buffer.from('1417525:secret').toString('base64')}`);
    expect(header).not.toContain('secret');
  });

  it('uses the configured return URL', () => {
    expect(paymentConfirmationUrl()).toMatch(/^https:\/\//);
  });
});
