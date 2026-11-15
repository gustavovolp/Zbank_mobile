import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { LoginScreen } from '@/modules/auth/presentation/screens/LoginScreen';
import { RegisterScreen } from '@/modules/auth/presentation/screens/RegisterScreen';
import { preloadMainScreens } from './screens';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(preloadMainScreens);
    return () => task.cancel();
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
