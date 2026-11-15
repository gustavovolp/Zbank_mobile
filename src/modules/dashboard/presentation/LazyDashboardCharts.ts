import { lazyComponent } from '@/core/presentation/lazy';

export const LazyDashboardCharts = lazyComponent(() => import('./DashboardCharts'), 'DashboardCharts');
