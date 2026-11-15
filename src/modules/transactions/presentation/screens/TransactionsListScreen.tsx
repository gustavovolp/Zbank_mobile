import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAppDispatch, useAppSelector } from '@/core/presentation/store/hooks';
import type { AppStackParamList } from '@/core/presentation/navigation/types';
import type { FieldErrors } from '@/core/domain/errors';
import { BootstrapIcon } from '@/core/presentation/components/BootstrapIcon';
import { Button } from '@/core/presentation/components/Button';
import { SelectField } from '@/core/presentation/components/SelectField';
import { colors, radius, spacing } from '@/core/presentation/theme';
import { CATEGORIAS_POR_TIPO, type CategoriaValue } from '../../domain/categories';
import type { Transaction, TransactionFilters, TransactionType } from '../../domain/entities';
import { validateFilterRange } from '../../domain/validation';
import { TransactionItem } from '../components/TransactionItem';
import { createSearchStream, type SearchStream } from '../state/searchStream';
import { selectVisibleTransactions } from '../state/selectors';
import {
  applyFilters,
  fetchFirstPage,
  fetchNextPage,
  searchChanged,
} from '../state/transactionsSlice';

const TIPO_OPCOES = [
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
];

const TODAS_CATEGORIAS = [...CATEGORIAS_POR_TIPO.deposito, ...CATEGORIAS_POR_TIPO.transferencia].map((c) => ({
  value: c.value as string,
  label: c.label as string,
}));

const keyExtractor = (item: Transaction) => item.id;

export function TransactionsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const dispatch = useAppDispatch();

  const transactions = useAppSelector(selectVisibleTransactions);
  const status = useAppSelector((state) => state.transactions.status);
  const hasMore = useAppSelector((state) => state.transactions.hasMore);
  const error = useAppSelector((state) => state.transactions.error);
  const filters = useAppSelector((state) => state.transactions.filters);
  const storedSearch = useAppSelector((state) => state.transactions.search);

  const [busca, setBusca] = useState(storedSearch);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [rascunho, setRascunho] = useState<TransactionFilters>(filters);
  const [errosFiltro, setErrosFiltro] = useState<FieldErrors>({});
  const searchRef = useRef<SearchStream | null>(null);

  useEffect(() => {
    const stream = createSearchStream((term) => dispatch(searchChanged(term)));
    searchRef.current = stream;
    return () => {
      stream.dispose();
      searchRef.current = null;
    };
  }, [dispatch]);

  const categoriaOpcoes = useMemo(
    () =>
      rascunho.tipo
        ? CATEGORIAS_POR_TIPO[rascunho.tipo].map((c) => ({ value: c.value as string, label: c.label as string }))
        : TODAS_CATEGORIAS,
    [rascunho.tipo]
  );

  const abrirTransacao = useCallback(
    (transactionId: string) => navigation.navigate('TransactionForm', { transactionId }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => <TransactionItem transaction={item} onPress={abrirTransacao} />,
    [abrirTransacao]
  );

  const handleRefresh = useCallback(() => {
    void dispatch(fetchFirstPage({ mode: 'refresh' }));
  }, [dispatch]);

  const handleEndReached = useCallback(() => {
    if (hasMore) void dispatch(fetchNextPage());
  }, [dispatch, hasMore]);

  function handleBuscaChange(texto: string) {
    setBusca(texto);
    searchRef.current?.next(texto);
  }

  function limparBusca() {
    setBusca('');
    searchRef.current?.flush('');
  }

  function abrirFiltros() {
    setRascunho(filters);
    setErrosFiltro({});
    setFiltrosAbertos(true);
  }

  function aplicarFiltros() {
    const erros = validateFilterRange(rascunho);
    setErrosFiltro(erros);
    if (Object.keys(erros).length > 0) return;

    void dispatch(applyFilters(rascunho));
    setFiltrosAbertos(false);
  }

  function limparFiltros() {
    setRascunho({});
    setErrosFiltro({});
    void dispatch(applyFilters({}));
    setFiltrosAbertos(false);
  }

  const filtrosAtivos = Boolean(filters.tipo || filters.categoria || filters.dataInicio || filters.dataFim);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.buscaContainer}>
          <BootstrapIcon name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={busca}
            onChangeText={handleBuscaChange}
            placeholder="Buscar por descrição..."
            placeholderTextColor={colors.textMuted}
            style={styles.busca}
          />
          {busca.length > 0 && (
            <Pressable onPress={limparBusca} hitSlop={8}>
              <BootstrapIcon name="x-lg" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={[styles.filtroBotao, filtrosAtivos && styles.filtroBotaoAtivo]}
          onPress={abrirFiltros}
        >
          <BootstrapIcon name="funnel" size={16} color={filtrosAtivos ? colors.white : colors.text} />
          <Text style={[styles.filtroTexto, filtrosAtivos && styles.filtroTextoAtivo]}>Filtros</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.erro}>{error}</Text> : null}

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loadingInicial} color={colors.primary} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.lista}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={status === 'refreshing'} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhuma transação encontrada com os filtros atuais.</Text>
          }
          ListFooterComponent={
            status === 'loadingMore' ? (
              <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.primary} />
            ) : null
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate('TransactionForm', undefined)}>
        <BootstrapIcon name="plus-lg" size={22} color={colors.white} />
      </Pressable>

      <Modal visible={filtrosAbertos} animationType="slide" transparent onRequestClose={() => setFiltrosAbertos(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFiltrosAbertos(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitulo}>Filtrar transações</Text>

            <SelectField
              label="Tipo"
              value={rascunho.tipo}
              options={TIPO_OPCOES}
              onChange={(value) =>
                setRascunho((prev) => ({ ...prev, tipo: value as TransactionType, categoria: undefined }))
              }
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
              <View style={styles.campoData}>
                <TextInput
                  value={rascunho.dataInicio ?? ''}
                  onChangeText={(v) => setRascunho((prev) => ({ ...prev, dataInicio: v || undefined }))}
                  placeholder="Início (AAAA-MM-DD)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.dataInput, errosFiltro.dataInicio ? styles.dataInputErro : null]}
                />
                {errosFiltro.dataInicio ? <Text style={styles.erroCampo}>{errosFiltro.dataInicio}</Text> : null}
              </View>
              <View style={styles.campoData}>
                <TextInput
                  value={rascunho.dataFim ?? ''}
                  onChangeText={(v) => setRascunho((prev) => ({ ...prev, dataFim: v || undefined }))}
                  placeholder="Fim (AAAA-MM-DD)"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.dataInput, errosFiltro.dataFim ? styles.dataInputErro : null]}
                />
                {errosFiltro.dataFim ? <Text style={styles.erroCampo}>{errosFiltro.dataFim}</Text> : null}
              </View>
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
  buscaContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  busca: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  filtroBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    paddingHorizontal: spacing.lg,
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
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
    gap: spacing.sm,
  },
  campoData: {
    flex: 1,
  },
  dataInput: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
  dataInputErro: {
    borderColor: colors.danger,
  },
  erroCampo: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
