import type { ProfileAudit, ProfileInput } from '../domain/profile';
import type { PlatformAnalyzer } from './platform-analyzer';
import { createProfileAudit } from '../scoring/profile-scoring';
export class KworkAnalyzer implements PlatformAnalyzer { analyze(input: ProfileInput): ProfileAudit { return createProfileAudit(input, 'Kwork'); } }
