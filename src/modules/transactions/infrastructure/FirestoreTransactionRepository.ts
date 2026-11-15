import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import type {
  ListPageParams,
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionPage,
} from '../domain/entities';
import type { TransactionRepository } from '../domain/TransactionRepository';

const MAX_REMEMBERED_CURSORS = 50;

function buildConstraints(filters: TransactionFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filters.tipo) constraints.push(where('tipo', '==', filters.tipo));
  if (filters.categoria) constraints.push(where('categoria', '==', filters.categoria));
  if (filters.dataInicio) constraints.push(where('data', '>=', filters.dataInicio));
  if (filters.dataFim) constraints.push(where('data', '<=', filters.dataFim));

  if (filters.dataInicio || filters.dataFim) {
    constraints.push(orderBy('data', 'desc'));
  }
  constraints.push(orderBy('criadoEm', 'desc'));

  return constraints;
}

function toTransaction(snapshot: DocumentSnapshot<DocumentData>): Transaction {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    valor: Number(data.valor),
    tipo: data.tipo,
    data: data.data,
    descricao: data.descricao,
    categoria: data.categoria,
    criadoEm: Number(data.criadoEm),
  };
}

export class FirestoreTransactionRepository implements TransactionRepository {
  private readonly cursorSnapshots = new Map<string, DocumentSnapshot<DocumentData>>();

  constructor(private readonly db: Firestore) {}

  private collectionFor(uid: string) {
    return collection(this.db, 'users', uid, 'transactions');
  }

  private rememberCursor(uid: string, snapshot: DocumentSnapshot<DocumentData>): void {
    this.cursorSnapshots.set(`${uid}/${snapshot.id}`, snapshot);
    if (this.cursorSnapshots.size > MAX_REMEMBERED_CURSORS) {
      const oldest = this.cursorSnapshots.keys().next().value;
      if (oldest !== undefined) this.cursorSnapshots.delete(oldest);
    }
  }

  private async resolveCursor(uid: string, cursor: string): Promise<DocumentSnapshot<DocumentData> | null> {
    const remembered = this.cursorSnapshots.get(`${uid}/${cursor}`);
    if (remembered) return remembered;

    const snapshot = await getDoc(doc(this.collectionFor(uid), cursor));
    return snapshot.exists() ? snapshot : null;
  }

  async listPage(uid: string, { filters, cursor, pageSize }: ListPageParams): Promise<TransactionPage> {
    const constraints = buildConstraints(filters);
    const startDocument = cursor ? await this.resolveCursor(uid, cursor) : null;
    if (cursor && !startDocument) return { items: [], nextCursor: null };

    const pageQuery = startDocument
      ? query(this.collectionFor(uid), ...constraints, startAfter(startDocument), limit(pageSize))
      : query(this.collectionFor(uid), ...constraints, limit(pageSize));

    const snapshot = await getDocs(pageQuery);
    const last = snapshot.docs[snapshot.docs.length - 1];
    if (last) this.rememberCursor(uid, last);

    return {
      items: snapshot.docs.map(toTransaction),
      nextCursor: last && snapshot.docs.length === pageSize ? last.id : null,
    };
  }

  observeRecent(uid: string, max: number): Observable<Transaction[]> {
    return new Observable<Transaction[]>((subscriber) => {
      const recentQuery = query(this.collectionFor(uid), orderBy('criadoEm', 'desc'), limit(max));
      return onSnapshot(
        recentQuery,
        (snapshot) => subscriber.next(snapshot.docs.map(toTransaction)),
        (error) => subscriber.error(error)
      );
    });
  }

  async add(uid: string, input: TransactionInput, createdAt: number = Date.now()): Promise<Transaction> {
    const data = { ...input, criadoEm: createdAt };
    const reference = await addDoc(this.collectionFor(uid), data);
    return { id: reference.id, ...data };
  }

  async update(uid: string, id: string, input: TransactionInput): Promise<void> {
    await updateDoc(doc(this.collectionFor(uid), id), { ...input });
  }

  async remove(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(this.collectionFor(uid), id));
  }
}
