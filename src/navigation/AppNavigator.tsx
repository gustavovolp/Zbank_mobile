import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BootstrapIcon } from '../components/BootstrapIcon';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionFormScreen } from '../screens/TransactionFormScreen';
import { TransactionsListScreen } from '../screens/TransactionsListScreen';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { confirmarAcao } from '../utils/confirm';
import type { AppStackParamList, TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function LogoutPlaceholder() {
  return null;
}

function Tabs() {
  const { logout } = useAuth();

  async function confirmarLogout() {
    const confirmou = await confirmarAcao('Sair', 'Deseja realmente sair da sua conta?', 'Sair');
    if (confirmou) await logout();
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
          tabPress: (e) => {
            e.preventDefault();
            confirmarLogout();
          },
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
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
