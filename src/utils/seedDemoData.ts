import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CategoriaValue } from '../constants/categorias';
import type { TransactionType } from '../types/transaction';

interface AmostraTransacao {
  tipo: TransactionType;
  categoria: CategoriaValue;
  valor: number;
  descricao: string;
  diasAtras: number;
}

const TRANSACOES_EXEMPLO: AmostraTransacao[] = [
  { tipo: 'deposito', categoria: 'salario', valor: 3200, descricao: 'Salário', diasAtras: 12 },
  { tipo: 'transferencia', categoria: 'moradia', valor: 950, descricao: 'Aluguel', diasAtras: 11 },
  { tipo: 'transferencia', categoria: 'alimentacao', valor: 62.9, descricao: 'Supermercado', diasAtras: 9 },
  { tipo: 'transferencia', categoria: 'transporte', valor: 28, descricao: 'Uber', diasAtras: 8 },
  { tipo: 'deposito', categoria: 'freelance', valor: 450, descricao: 'Freelance de design', diasAtras: 7 },
  { tipo: 'transferencia', categoria: 'lazer', valor: 80, descricao: 'Cinema com amigos', diasAtras: 6 },
  { tipo: 'transferencia', categoria: 'contas', valor: 145, descricao: 'Conta de energia', diasAtras: 5 },
  { tipo: 'transferencia', categoria: 'assinaturas', valor: 39.9, descricao: 'Assinatura de streaming', diasAtras: 4 },
  { tipo: 'deposito', categoria: 'reembolso', valor: 120, descricao: 'Reembolso da faculdade', diasAtras: 3 },
  { tipo: 'transferencia', categoria: 'saude', valor: 90, descricao: 'Farmácia', diasAtras: 1 },
];

function paraDataISO(diasAtras: number): string {
  const data = new Date();
  data.setDate(data.getDate() - diasAtras);
  return data.toISOString().slice(0, 10);
}

export async function seedDemoTransactions(uid: string): Promise<void> {
  const col = collection(db, 'users', uid, 'transactions');
  const agora = Date.now();

  await Promise.all(
    TRANSACOES_EXEMPLO.map(({ diasAtras, ...resto }, index) =>
      addDoc(col, {
        ...resto,
        data: paraDataISO(diasAtras),
        criadoEm: agora - (TRANSACOES_EXEMPLO.length - index) * 1000,
      })
    )
  );
}
