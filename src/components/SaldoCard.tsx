import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface SaldoCardProps {
  saldo: number;
  receitas: number;
  despesas: number;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function SaldoCard({ saldo, receitas, despesas }: SaldoCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saldo atual</Text>
      <Text style={[styles.saldo, saldo < 0 && styles.saldoNegativo]}>{formatarMoeda(saldo)}</Text>

      <View style={styles.linha}>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <View>
            <Text style={styles.itemLabel}>Receitas</Text>
            <Text style={styles.itemValor}>{formatarMoeda(receitas)}</Text>
          </View>
        </View>
        <View style={styles.item}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <View>
            <Text style={styles.itemLabel}>Despesas</Text>
            <Text style={styles.itemValor}>{formatarMoeda(despesas)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  saldo: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  saldoNegativo: {
    color: '#FFB4B4',
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  itemValor: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
