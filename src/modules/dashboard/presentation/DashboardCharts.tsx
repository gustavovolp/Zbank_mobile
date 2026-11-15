import { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { colors, fonts, radius, spacing } from '@/core/presentation/theme';
import { findCategoryLabel, isCategoryOfType } from '@/modules/transactions/domain/categories';
import type { FinancialSummary } from '@/modules/transactions/domain/summary';

const LARGURA_TELA = Dimensions.get('window').width;
const LARGURA_GRAFICO = LARGURA_TELA - spacing.lg * 4;
const CORES_CATEGORIAS = ['#9747FF', '#502588', '#1FA672', '#E2483D', '#F5A623', '#4A90D9', '#D9738C', '#6BC1B0'];

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  color: (opacity = 1) => `rgba(151, 71, 255, ${opacity})`,
  labelColor: () => colors.textMuted,
  decimalPlaces: 0,
  barPercentage: 0.6,
};

interface DashboardChartsProps {
  summary: FinancialSummary;
}

export function DashboardCharts({ summary }: DashboardChartsProps) {
  const dadosBarras = useMemo(
    () => ({
      labels: ['Receitas', 'Despesas'],
      datasets: [{ data: [summary.receitas, summary.despesas] }],
    }),
    [summary.receitas, summary.despesas]
  );

  const dadosPizza = useMemo(
    () =>
      Object.entries(summary.porCategoria)
        .filter(([categoria]) => isCategoryOfType('transferencia', categoria))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([categoria, valor], index) => ({
          name: findCategoryLabel(categoria),
          population: valor,
          color: CORES_CATEGORIAS[index % CORES_CATEGORIAS.length],
          legendFontColor: colors.text,
          legendFontSize: 12,
        })),
    [summary.porCategoria]
  );

  if (summary.receitas === 0 && summary.despesas === 0) {
    return <Text style={styles.textoMuted}>Sem dados suficientes para gerar gráficos.</Text>;
  }

  return (
    <View>
      <Text style={styles.cardTitulo}>Receitas x Despesas</Text>
      <BarChart
        data={dadosBarras}
        width={LARGURA_GRAFICO}
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
            width={LARGURA_GRAFICO}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
