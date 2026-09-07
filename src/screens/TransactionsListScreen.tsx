import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { SelectField } from '../components/SelectField';
import { TransactionItem } from '../components/TransactionItem';
import { CATEGORIAS_POR_TIPO, type CategoriaValue } from '../constants/categorias';
import { colors, radius, spacing } from '../constants/theme';
import { useTransactions } from '../contexts/TransactionsContext';
import type { AppStackParamList } from '../navigation/types';
import type { TransactionFilters, TransactionType } from '../types/transaction';

const TIPO_OPCOES = [
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
];

export function TransactionsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { transactions, loading, loadingMore, refreshing, hasMore, error, filters, setFilters, refresh, loadMore } =
    useTransactions();

  const [busca, setBusca] = useState(filters.busca ?? '');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [rascunho, setRascunho] = useState<TransactionFilters>(filters);

  const categoriaOpcoes = useMemo(() => {
    const tipo = (rascunho.tipo ?? 'deposito') as TransactionType;
    return CATEGORIAS_POR_TIPO[tipo].map((c) => ({ value: c.value, label: c.label }));
  }, [rascunho.tipo]);

  function aplicarBusca(texto: string) {
    setBusca(texto);
    setFilters({ ...filters, busca: texto });
  }

  function abrirFiltros() {
    setRascunho(filters);
    setFiltrosAbertos(true);
  }

  function aplicarFiltros() {
    setFilters({ ...rascunho, busca: filters.busca });
    setFiltrosAbertos(false);
  }

  function limparFiltros() {
    const limpo: TransactionFilters = { busca: filters.busca };
    setRascunho(limpo);
    setFilters(limpo);
    setFiltrosAbertos(false);
  }

  const filtrosAtivos = Boolean(filters.tipo || filters.categoria || filters.dataInicio || filters.dataFim);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          value={busca}
          onChangeText={aplicarBusca}
          placeholder="Buscar por descrição..."
          placeholderTextColor={colors.textMuted}
          style={styles.busca}
        />
        <Pressable
          style={[styles.filtroBotao, filtrosAtivos && styles.filtroBotaoAtivo]}
          onPress={abrirFiltros}
        >
          <Text style={[styles.filtroTexto, filtrosAtivos && styles.filtroTextoAtivo]}>Filtros</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.erro}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loadingInicial} color={colors.primary} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => navigation.navigate('TransactionForm', { transactionId: item.id })}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore) loadMore();
          }}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma transação encontrada com os filtros atuais.</Text>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary} /> : null
          }
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('TransactionForm', undefined)}
      >
        <Text style={styles.fabTexto}>+</Text>
      </Pressable>

      <Modal visible={filtrosAbertos} animationType="slide" transparent onRequestClose={() => setFiltrosAbertos(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFiltrosAbertos(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitulo}>Filtrar transações</Text>

            <SelectField
              label="Tipo"
              value={rascunho.tipo}
              options={TIPO_OPCOES}
              onChange={(value) => setRascunho((prev) => ({ ...prev, tipo: value as TransactionType, categoria: undefined }))}
              placeholder="Todos os tipos"
            />
            <SelectField
              label="Categoria"
              value={rascunho.categoria}
              options={categoriaOpcoes}
              onChange={(value) => setRascunho((prev) => ({ ...prev, categoria: value as CategoriaValue }))}
              placeholder="Todas as categorias"
            />

            <View style={styles.linhaData}>
              <TextInput
                value={rascunho.dataInicio ?? ''}
                onChangeText={(v) => setRascunho((prev) => ({ ...prev, dataInicio: v || undefined }))}
                placeholder="Início (AAAA-MM-DD)"
                placeholderTextColor={colors.textMuted}
                style={[styles.dataInput, { marginRight: spacing.sm }]}
              />
              <TextInput
                value={rascunho.dataFim ?? ''}
                onChangeText={(v) => setRascunho((prev) => ({ ...prev, dataFim: v || undefined }))}
                placeholder="Fim (AAAA-MM-DD)"
                placeholderTextColor={colors.textMuted}
                style={styles.dataInput}
              />
            </View>

            <Button label="Aplicar filtros" onPress={aplicarFiltros} style={{ marginTop: spacing.md }} />
            <Button label="Limpar filtros" variant="ghost" onPress={limparFiltros} style={{ marginTop: spacing.sm }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  busca: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  filtroBotao: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filtroBotaoAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroTexto: {
    color: colors.text,
    fontWeight: '600',
  },
  filtroTextoAtivo: {
    color: colors.white,
  },
  lista: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  loadingInicial: {
    marginTop: spacing.xl,
  },
  vazio: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  erro: {
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabTexto: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  linhaData: {
    flexDirection: 'row',
  },
  dataInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
});
