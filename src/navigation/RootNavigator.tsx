import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { TransactionsProvider } from '../contexts/TransactionsContext';
import { AppNavigator } from './AppNavigator';
import { AuthStack } from './AuthStack';

export function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  return (
    <TransactionsProvider>
      <AppNavigator />
    </TransactionsProvider>
  );
}
