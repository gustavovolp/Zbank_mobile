import { ActivityIndicator, View } from 'react-native';
import { useAppSelector } from '@/shell/hooks';
import { colors } from '@/core/presentation/theme';
import { AppNavigator } from './AppNavigator';
import { AuthStack } from './AuthStack';

export function RootNavigator() {
  const status = useAppSelector((state) => state.auth.status);

  if (status === 'initializing') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return status === 'authenticated' ? <AppNavigator /> : <AuthStack />;
}
