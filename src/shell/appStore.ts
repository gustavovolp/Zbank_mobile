import { container } from '@/core/di/container';
import { createAppStore } from './store';

export const store = createAppStore(container);
