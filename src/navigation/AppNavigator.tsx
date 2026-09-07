import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionFormScreen } from '../screens/TransactionFormScreen';
import { TransactionsListScreen } from '../screens/TransactionsListScreen';
import { colors } from '../constants/theme';
import type { AppStackParamList, TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function Tabs() {
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
        options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsListScreen}
        options={{ title: 'Transações', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📄</Text> }}
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
