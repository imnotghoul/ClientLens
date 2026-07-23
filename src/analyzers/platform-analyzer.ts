import type { ProfileAudit, ProfileInput } from '../domain/profile';
export interface PlatformAnalyzer { analyze(input: ProfileInput): ProfileAudit; }
