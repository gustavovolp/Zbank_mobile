import { lazyComponent } from '@/core/presentation/lazy';

export const DashboardScreen = lazyComponent(
  () => import('@/modules/dashboard/presentation/DashboardScreen'),
  'DashboardScreen'
);

export const TransactionsListScreen = lazyComponent(
  () => import('@/modules/transactions/presentation/screens/TransactionsListScreen'),
  'TransactionsListScreen'
);

export const TransactionFormScreen = lazyComponent(
  () => import('@/modules/transactions/presentation/screens/TransactionFormScreen'),
  'TransactionFormScreen'
);

export function preloadMainScreens(): void {
  void DashboardScreen.preload();
  void TransactionsListScreen.preload();
}

export function preloadSecondaryScreens(): void {
  void TransactionFormScreen.preload();
}
