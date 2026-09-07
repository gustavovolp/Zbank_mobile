import {
  collection,
  deleteDoc,
  doc,
  type DocumentSnapshot,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { db, storage } from '../config/firebase';
import { type ArquivoSelecionado, validarArquivoAnexo } from '../utils/anexoUtils';
import type { Anexo, Transaction, TransactionFilters, TransactionInput } from '../types/transaction';
import { useAuth } from './AuthContext';

const PAGE_SIZE = 15;
const RESUMO_LIMITE = 300;

interface ResumoFinanceiro {
  saldo: number;
  receitas: number;
  despesas: number;
  porCategoria: Record<string, number>;
}

interface TransactionsContextValue {
  transactions: Transaction[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  addTransaction: (input: TransactionInput, arquivo?: ArquivoSelecionado | null) => Promise<void>;
  updateTransaction: (
    id: string,
    input: TransactionInput,
    opcoes?: { novoArquivo?: ArquivoSelecionado | null; removerAnexo?: boolean }
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  resumo: ResumoFinanceiro;
  resumoCarregando: boolean;
  todasTransacoes: Transaction[];
}

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

function docToTransaction(docSnap: DocumentSnapshot): Transaction {
  const data = docSnap.data() as Omit<Transaction, 'id'>;
  return { ...data, id: docSnap.id };
}

function buildConstraints(filters: TransactionFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filters.tipo) constraints.push(where('tipo', '==', filters.tipo));
  if (filters.categoria) constraints.push(where('categoria', '==', filters.categoria));
  if (filters.dataInicio) constraints.push(where('data', '>=', filters.dataInicio));
  if (filters.dataFim) constraints.push(where('data', '<=', filters.dataFim));

  const temFiltroData = Boolean(filters.dataInicio || filters.dataFim);
  if (temFiltroData) {
    constraints.push(orderBy('data', 'desc'));
  }
  constraints.push(orderBy('criadoEm', 'desc'));

  return constraints;
}

function aplicarBuscaLocal(lista: Transaction[], busca?: string): Transaction[] {
  if (!busca?.trim()) return lista;
  const termo = busca.trim().toLowerCase();
  return lista.filter((t) => t.descricao.toLowerCase().includes(termo));
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;

  const [filters, setFilters] = useState<TransactionFilters>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [todasTransacoes, setTodasTransacoes] = useState<Transaction[]>([]);
  const [resumoCarregando, setResumoCarregando] = useState(true);

  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  const fetchPage = useCallback(
    async (opts: { reset: boolean }) => {
      if (!uid) return;

      const col = collection(db, 'users', uid, 'transactions');
      const constraints = buildConstraints(filters);
      const cursor = opts.reset ? null : lastDocRef.current;

      const q = cursor
        ? query(col, ...constraints, startAfter(cursor), limit(PAGE_SIZE))
        : query(col, ...constraints, limit(PAGE_SIZE));

      const snap = await getDocs(q);
      const novos = snap.docs.map(docToTransaction);

      lastDocRef.current = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : lastDocRef.current;
      setHasMore(snap.docs.length === PAGE_SIZE);
      setTransactions((prev) => (opts.reset ? novos : [...prev, ...novos]));
    },
    [uid, filters]
  );

  const refresh = useCallback(async () => {
    if (!uid) return;
    setError(null);
    setRefreshing(true);
    lastDocRef.current = null;
    try {
      await fetchPage({ reset: true });
    } catch (err) {
      setError('Não foi possível carregar as transações. Verifique sua conexão e tente novamente.');
      console.error(err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [uid, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!uid || loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      await fetchPage({ reset: false });
    } catch (err) {
      setError('Não foi possível carregar mais transações.');
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  }, [uid, loadingMore, hasMore, loading, refreshing, fetchPage]);

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    lastDocRef.current = null;
    fetchPage({ reset: true })
      .catch((err) => {
        setError('Não foi possível carregar as transações. Verifique sua conexão e tente novamente.');
        console.error(err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, filters]);

  useEffect(() => {
    if (!uid) {
      setTodasTransacoes([]);
      setResumoCarregando(false);
      return;
    }
    setResumoCarregando(true);
    const col = collection(db, 'users', uid, 'transactions');
    const q = query(col, orderBy('criadoEm', 'desc'), limit(RESUMO_LIMITE));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setTodasTransacoes(snap.docs.map(docToTransaction));
        setResumoCarregando(false);
      },
      (err) => {
        console.error(err);
        setResumoCarregando(false);
      }
    );
    return unsubscribe;
  }, [uid]);

  const resumo = useMemo<ResumoFinanceiro>(() => {
    return todasTransacoes.reduce<ResumoFinanceiro>(
      (acc, t) => {
        if (t.tipo === 'deposito') {
          acc.receitas += t.valor;
          acc.saldo += t.valor;
        } else {
          acc.despesas += t.valor;
          acc.saldo -= t.valor;
        }
        acc.porCategoria[t.categoria] = (acc.porCategoria[t.categoria] ?? 0) + t.valor;
        return acc;
      },
      { saldo: 0, receitas: 0, despesas: 0, porCategoria: {} }
    );
  }, [todasTransacoes]);

  const transacoesFiltradas = useMemo(
    () => aplicarBuscaLocal(transactions, filters.busca),
    [transactions, filters.busca]
  );

  const uploadAnexo = useCallback(
    async (transactionId: string, arquivo: ArquivoSelecionado): Promise<Anexo> => {
      if (!uid) throw new Error('Usuário não autenticado.');
      const erroValidacao = validarArquivoAnexo(arquivo);
      if (erroValidacao) throw new Error(erroValidacao);

      const resposta = await fetch(arquivo.uri);
      const blob = await resposta.blob();
      const caminho = `receipts/${uid}/${transactionId}/${Date.now()}_${arquivo.nome}`;
      const storageRef = ref(storage, caminho);
      await uploadBytes(storageRef, blob, { contentType: arquivo.tipoArquivo });
      const url = await getDownloadURL(storageRef);

      return {
        nome: arquivo.nome,
        tipoArquivo: arquivo.tipoArquivo as Anexo['tipoArquivo'],
        tamanho: arquivo.tamanho,
        url,
      };
    },
    [uid]
  );

  const removerAnexoDoStorage = useCallback(async (anexo?: Anexo | null) => {
    if (!anexo?.url) return;
    try {
      await deleteObject(ref(storage, anexo.url));
    } catch (err) {
      console.warn('Não foi possível remover o anexo antigo do Storage:', err);
    }
  }, []);

  const addTransaction = useCallback(
    async (input: TransactionInput, arquivo?: ArquivoSelecionado | null) => {
      if (!uid) throw new Error('Usuário não autenticado.');

      const novoDocRef = doc(collection(db, 'users', uid, 'transactions'));
      const anexo = arquivo ? await uploadAnexo(novoDocRef.id, arquivo) : null;

      await setDoc(novoDocRef, {
        ...input,
        anexo,
        criadoEm: Date.now(),
      });

      await refresh();
    },
    [uid, uploadAnexo, refresh]
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      input: TransactionInput,
      opcoes?: { novoArquivo?: ArquivoSelecionado | null; removerAnexo?: boolean }
    ) => {
      if (!uid) throw new Error('Usuário não autenticado.');

      const existente = transactions.find((t) => t.id === id) ?? todasTransacoes.find((t) => t.id === id);
      let anexo: Anexo | null | undefined = existente?.anexo ?? null;

      if (opcoes?.novoArquivo) {
        await removerAnexoDoStorage(existente?.anexo);
        anexo = await uploadAnexo(id, opcoes.novoArquivo);
      } else if (opcoes?.removerAnexo) {
        await removerAnexoDoStorage(existente?.anexo);
        anexo = null;
      }

      const docRef = doc(db, 'users', uid, 'transactions', id);
      await setDoc(
        docRef,
        {
          ...input,
          anexo,
          criadoEm: existente?.criadoEm ?? Date.now(),
        },
        { merge: true }
      );

      await refresh();
    },
    [uid, transactions, todasTransacoes, uploadAnexo, removerAnexoDoStorage, refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!uid) throw new Error('Usuário não autenticado.');
      const existente = transactions.find((t) => t.id === id) ?? todasTransacoes.find((t) => t.id === id);
      await removerAnexoDoStorage(existente?.anexo);
      await deleteDoc(doc(db, 'users', uid, 'transactions', id));
      await refresh();
    },
    [uid, transactions, todasTransacoes, removerAnexoDoStorage, refresh]
  );

  const getTransactionById = useCallback(
    (id: string) => transactions.find((t) => t.id === id) ?? todasTransacoes.find((t) => t.id === id),
    [transactions, todasTransacoes]
  );

  const value = useMemo<TransactionsContextValue>(
    () => ({
      transactions: transacoesFiltradas,
      loading,
      loadingMore,
      refreshing,
      hasMore,
      error,
      filters,
      setFilters,
      refresh,
      loadMore,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      resumo,
      resumoCarregando,
      todasTransacoes,
    }),
    [
      transacoesFiltradas,
      loading,
      loadingMore,
      refreshing,
      hasMore,
      error,
      filters,
      refresh,
      loadMore,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
      resumo,
      resumoCarregando,
      todasTransacoes,
    ]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions(): TransactionsContextValue {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions precisa ser usado dentro de um TransactionsProvider');
  }
  return context;
}
