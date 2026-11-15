import { Orbitron_400Regular, Orbitron_700Bold, useFonts } from '@expo-google-fonts/orbitron';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { AppBootstrap } from '@/shell/AppBootstrap';
import { store } from '@/shell/appStore';
import { RootNavigator } from '@/shell/navigation/RootNavigator';
import { container } from '@/core/di/container';
import { colors } from '@/core/presentation/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppBootstrap dependencies={container}>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="dark" />
          </AppBootstrap>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
