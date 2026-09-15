import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { SaldoCard } from '../components/SaldoCard';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { obterLabelCategoria, type CategoriaValue } from '../constants/categorias';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionsContext';

const LARGURA_TELA = Dimensions.get('window').width;
const CORES_CATEGORIAS = ['#9747FF', '#502588', '#1FA672', '#E2483D', '#F5A623', '#4A90D9', '#D9738C', '#6BC1B0'];

type Secao = 'resumo' | 'graficos';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DashboardScreen() {
  const { user } = useAuth();
  const { resumo, resumoCarregando, todasTransacoes } = useTransactions();
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

  const dadosPizza = useMemo(() => {
    return Object.entries(resumo.porCategoria)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([categoria, valor], index) => {
        const transacao = todasTransacoes.find((t) => t.categoria === categoria);
        const label = transacao ? obterLabelCategoria(transacao.tipo, categoria as CategoriaValue) : categoria;
        return {
          name: label,
          population: valor,
          color: CORES_CATEGORIAS[index % CORES_CATEGORIAS.length],
          legendFontColor: colors.text,
          legendFontSize: 12,
        };
      });
  }, [resumo.porCategoria, todasTransacoes]);

  const dadosBarras = useMemo(
    () => ({
      labels: ['Receitas', 'Despesas'],
      datasets: [{ data: [resumo.receitas, resumo.despesas] }],
    }),
    [resumo.receitas, resumo.despesas]
  );

  const nomeUsuario = user?.displayName?.split(' ')[0] || 'por aí';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.saudacao}>Olá, {nomeUsuario} </Text>

      <SaldoCard saldo={resumo.saldo} />

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
        {secao === 'resumo' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Por categoria</Text>
            {resumoCarregando ? (
              <Text style={styles.textoMuted}>Carregando...</Text>
            ) : Object.keys(resumo.porCategoria).length === 0 ? (
              <Text style={styles.textoMuted}>Nenhuma transação registrada ainda.</Text>
            ) : (
              Object.entries(resumo.porCategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([categoria, valor]) => {
                  const transacao = todasTransacoes.find((t) => t.categoria === categoria);
                  const label = transacao ? obterLabelCategoria(transacao.tipo, categoria as CategoriaValue) : categoria;
                  return (
                    <View key={categoria} style={styles.linhaCategoria}>
                      <Text style={styles.categoriaLabel}>{label}</Text>
                      <Text style={styles.categoriaValor}>{formatarMoeda(valor)}</Text>
                    </View>
                  );
                })
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Receitas x Despesas</Text>
            {resumo.receitas === 0 && resumo.despesas === 0 ? (
              <Text style={styles.textoMuted}>Sem dados suficientes para gerar gráficos.</Text>
            ) : (
              <>
                <BarChart
                  data={dadosBarras}
                  width={LARGURA_TELA - spacing.lg * 4}
                  height={200}
                  yAxisLabel="R$"
                  yAxisSuffix=""
                  fromZero
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
                {dadosPizza.length > 0 && (
                  <>
                    <Text style={[styles.cardTitulo, { marginTop: spacing.lg }]}>Gastos por categoria</Text>
                    <PieChart
                      data={dadosPizza}
                      width={LARGURA_TELA - spacing.lg * 4}
                      height={200}
                      chartConfig={chartConfig}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="8"
                    />
                  </>
                )}
              </>
            )}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(151, 71, 255, ${opacity})`,
  labelColor: () => colors.textMuted,
  decimalPlaces: 0,
  barPercentage: 0.6,
};

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
  chart: {
    borderRadius: radius.md,
  },
  textoMuted: {
    color: colors.textMuted,
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
