import type { ProfileAudit, ProfileInput } from '../domain/profile';
import type { PlatformAnalyzer } from './platform-analyzer';
import { createProfileAudit } from '../scoring/profile-scoring';

export class ProfileAnalyzer implements PlatformAnalyzer {
  analyze(input: ProfileInput): ProfileAudit {
    return createProfileAudit(input, 'Профиль фрилансера');
  }
}
