import { describe, expect, it } from 'vitest';
import { parseTopUpAmount, paymentConfirmationUrl, paymentCreditDetails, yookassaAuthHeader } from './yookassa';

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

  it('accepts only successful payments with trusted metadata and a positive amount', () => {
    expect(paymentCreditDetails({ id: 'pay-1', status: 'succeeded', amount: { value: '100.00' }, metadata: { user_id: 'user-1' } }))
      .toEqual({ paymentId: 'pay-1', userId: 'user-1', amount: 100 });
    expect(paymentCreditDetails({ id: 'pay-2', status: 'pending', amount: { value: '100.00' }, metadata: { user_id: 'user-1' } })).toBeNull();
    expect(paymentCreditDetails({ id: 'pay-3', status: 'succeeded', amount: { value: '0' }, metadata: { user_id: 'user-1' } })).toBeNull();
    expect(paymentCreditDetails({ id: 'pay-4', status: 'succeeded', amount: { value: '100.00' } })).toBeNull();
  });
});
