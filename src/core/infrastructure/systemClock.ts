import type { Clock } from '@/core/domain/ports';

export const systemClock: Clock = {
  now: () => new Date(),
};
