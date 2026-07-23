import { describe, expect, it } from 'vitest';
import { toAuditRow } from './cloud-report-store';

describe('cloud report storage', () => {
  it('keeps a report scoped to its owner', () => {
    const row = toAuditRow('user-1', { id: 'report-1', createdAt: '2026-07-23T00:00:00.000Z' } as never);
    expect(row).toMatchObject({ id: 'report-1', user_id: 'user-1', created_at: '2026-07-23T00:00:00.000Z' });
  });
});
