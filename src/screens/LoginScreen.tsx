import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BootstrapIcon } from '../components/BootstrapIcon';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { colors, fonts, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    setErro(null);
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha para continuar.');
      return;
    }
    setCarregando(true);
    try {
      await login(email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoLinha}>
          <BootstrapIcon name="wallet2" size={28} color={colors.primary} />
          <Text style={styles.logo}>Zbank</Text>
        </View>
        <Text style={styles.subtitulo}>Gerenciamento financeiro na palma da mão</Text>

        <View style={styles.form}>
          <FormField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Button label="Entrar" onPress={handleLogin} loading={carregando} style={styles.botao} />
          <Button
            label="Criar conta"
            variant="ghost"
            onPress={() => navigation.navigate('Register')}
            style={styles.botao}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  logo: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.primary,
  },
  subtitulo: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
  },
  botao: {
    marginTop: spacing.sm,
  },
  erro: {
    color: colors.danger,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});
