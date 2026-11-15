import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BootstrapIcon } from '@/core/presentation/components/BootstrapIcon';
import { formatIsoDateForDisplay } from '@/core/presentation/dates';
import { colors, radius, spacing } from '@/core/presentation/theme';
import { obterLabelCategoria } from '../../domain/categories';
import type { Transaction } from '../../domain/entities';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (id: string) => void;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function TransactionItemComponent({ transaction, onPress }: TransactionItemProps) {
  const isDeposito = transaction.tipo === 'deposito';

  return (
    <Pressable style={styles.container} onPress={() => onPress(transaction.id)}>
      <BootstrapIcon
        name={isDeposito ? 'arrow-down-circle-fill' : 'arrow-up-circle-fill'}
        size={32}
        color={isDeposito ? colors.success : colors.danger}
      />

      <View style={styles.info}>
        <Text style={styles.descricao} numberOfLines={1}>
          {transaction.descricao}
        </Text>
        <Text style={styles.categoria}>
          {obterLabelCategoria(transaction.tipo, transaction.categoria)} · {formatIsoDateForDisplay(transaction.data)}
        </Text>
      </View>

      <Text style={[styles.valor, { color: isDeposito ? colors.success : colors.danger }]}>
        {isDeposito ? '+' : '-'} {formatarMoeda(transaction.valor)}
      </Text>
    </Pressable>
  );
}

export const TransactionItem = memo(TransactionItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  info: {
    flex: 1,
  },
  descricao: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  categoria: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  valor: {
    fontSize: 14,
    fontWeight: '700',
  },
});
