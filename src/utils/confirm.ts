import { Alert, Platform } from 'react-native';

// Alert.alert do React Native não tem implementação de diálogo no react-native-web
// (o app roda em várias plataformas: nativo via Expo Go/emulador, e web via `expo start --web`),
// então no web caímos para window.confirm para o app continuar funcionável.
export function confirmarAcao(titulo: string, mensagem: string, textoConfirmar = 'Confirmar'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }

  return new Promise((resolve) => {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: textoConfirmar, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

// Mesmo motivo do confirmarAcao acima: Alert.alert não exibe nada no web.
export function alertarAcao(titulo: string, mensagem: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}
