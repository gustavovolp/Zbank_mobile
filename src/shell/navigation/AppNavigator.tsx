import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useAppDispatch } from '@/shell/hooks';
import { BootstrapIcon } from '@/core/presentation/components/BootstrapIcon';
import { confirmarAcao } from '@/core/presentation/confirm';
import { colors } from '@/core/presentation/theme';
import { logout } from '@/modules/auth/presentation/state/authSlice';
import { LazyDashboardCharts } from '@/modules/dashboard/presentation/LazyDashboardCharts';
import {
  DashboardScreen,
  TransactionFormScreen,
  TransactionsListScreen,
  preloadSecondaryScreens,
} from './screens';
import type { AppStackParamList, TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function LogoutPlaceholder() {
  return null;
}

function Tabs() {
  const dispatch = useAppDispatch();

  async function confirmarLogout() {
    const confirmou = await confirmarAcao('Sair', 'Deseja realmente sair da sua conta?', 'Sair');
    if (confirmou) await dispatch(logout());
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <BootstrapIcon name="house-door-fill" size={20} color={color} /> }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsListScreen}
        options={{
          title: 'Transações',
          tabBarIcon: ({ color }) => <BootstrapIcon name="receipt" size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Logout"
        component={LogoutPlaceholder}
        options={{
          title: 'Sair',
          tabBarIcon: ({ color }) => <BootstrapIcon name="box-arrow-right" size={20} color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();
            void confirmarLogout();
          },
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      preloadSecondaryScreens();
      void LazyDashboardCharts.preload();
    });
    return () => task.cancel();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen
        name="TransactionForm"
        component={TransactionFormScreen}
        options={{ headerShown: true, title: '', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
