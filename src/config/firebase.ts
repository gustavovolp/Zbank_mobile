import AsyncStorage from '@react-native-async-storage/async-storage';
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth, initializeAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function assertFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Configuração do Firebase incompleta. Preencha o .env com base no .env.example (faltando: ${missing.join(', ')}).`
    );
  }
}

assertFirebaseConfig();

export const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

function createAuth(): Auth {
  // No web (usado só para smoke-test em `expo start --web`), o SDK já persiste
  // a sessão via localStorage/indexedDB por padrão. No nativo (iOS/Android),
  // a persistência precisa ser configurada explicitamente com AsyncStorage —
  // exportado apenas na condição "react-native" do pacote firebase/auth.
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  const { getReactNativePersistence } = require('firebase/auth');
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth: Auth = createAuth();

export const db: Firestore = getFirestore(app);
