import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '@/shell/hooks';
import { colors, fonts, radius, spacing } from '@/core/presentation/theme';
import { findCategoryLabel } from '@/modules/transactions/domain/categories';
import { selectSummary } from '@/modules/transactions/presentation/state/selectors';
import { LazyDashboardCharts } from './LazyDashboardCharts';
import { SaldoCard } from './SaldoCard';

type Secao = 'resumo' | 'graficos';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DashboardScreen() {
  const summary = useAppSelector(selectSummary);
  const recentStatus = useAppSelector((state) => state.transactions.recentStatus);
  const recentError = useAppSelector((state) => state.transactions.recentError);
  const displayName = useAppSelector((state) => state.auth.user?.displayName);
  const [secao, setSecao] = useState<Secao>('resumo');
  const fade = useRef(new Animated.Value(1)).current;

  function trocarSecao(nova: Secao) {
    if (nova === secao) return;
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setSecao(nova);
  }

  const categorias = useMemo(
    () => Object.entries(summary.porCategoria).sort(([, a], [, b]) => b - a),
    [summary.porCategoria]
  );

  const nomeUsuario = displayName?.split(' ')[0] || 'por aí';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.saudacao}>Olá, {nomeUsuario}</Text>

      <SaldoCard saldo={summary.saldo} />

      <View style={styles.segmentado}>
        <Pressable
          style={[styles.segmento, secao === 'resumo' && styles.segmentoAtivo]}
          onPress={() => trocarSecao('resumo')}
        >
          <Text style={[styles.segmentoTexto, secao === 'resumo' && styles.segmentoTextoAtivo]}>Resumo</Text>
        </Pressable>
        <Pressable
          style={[styles.segmento, secao === 'graficos' && styles.segmentoAtivo]}
          onPress={() => trocarSecao('graficos')}
        >
          <Text style={[styles.segmentoTexto, secao === 'graficos' && styles.segmentoTextoAtivo]}>Gráficos</Text>
        </Pressable>
      </View>

      <Animated.View style={{ opacity: fade }}>
        <View style={styles.card}>
          {recentStatus === 'error' ? (
            <Text style={styles.erro}>{recentError}</Text>
          ) : secao === 'resumo' ? (
            <>
              <Text style={styles.cardTitulo}>Por categoria</Text>
              {recentStatus === 'loading' ? (
                <Text style={styles.textoMuted}>Carregando...</Text>
              ) : categorias.length === 0 ? (
                <Text style={styles.textoMuted}>Nenhuma transação registrada ainda.</Text>
              ) : (
                categorias.map(([categoria, valor]) => (
                  <View key={categoria} style={styles.linhaCategoria}>
                    <Text style={styles.categoriaLabel}>{findCategoryLabel(categoria)}</Text>
                    <Text style={styles.categoriaValor}>{formatarMoeda(valor)}</Text>
                  </View>
                ))
              )}
            </>
          ) : (
            <LazyDashboardCharts summary={summary} />
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  saudacao: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  segmentado: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmento: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentoAtivo: {
    backgroundColor: colors.primary,
  },
  segmentoTexto: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  segmentoTextoAtivo: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardTitulo: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textoMuted: {
    color: colors.textMuted,
  },
  erro: {
    color: colors.danger,
  },
  linhaCategoria: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriaLabel: {
    color: colors.text,
  },
  categoriaValor: {
    color: colors.text,
    fontWeight: '700',
  },
});
