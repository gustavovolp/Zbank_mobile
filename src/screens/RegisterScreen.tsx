import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { colors, fonts, spacing } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { validarSenha } from '../utils/senha';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { registrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleRegistrar() {
    setErro(null);

    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha todos os campos para criar sua conta.');
      return;
    }
    const erroSenha = validarSenha(senha);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      await registrar(nome, email, senha);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Criar conta</Text>
        <Text style={styles.subtitulo}>Leva menos de um minuto</Text>

        <View style={styles.form}>
          <FormField label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" />
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
            placeholder="Mín. 6 caracteres, 1 maiúscula, 1 especial"
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.dicaSenha}>
            Use pelo menos 6 caracteres, com 1 letra maiúscula e 1 caractere especial (ex: !@#$%).
          </Text>
          <FormField
            label="Confirmar senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            placeholder="Repita a senha"
            secureTextEntry
            autoCapitalize="none"
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Button label="Criar conta" onPress={handleRegistrar} loading={carregando} style={styles.botao} />
          <Button
            label="Já tenho conta"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
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
  titulo: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitulo: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  dicaSenha: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
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
