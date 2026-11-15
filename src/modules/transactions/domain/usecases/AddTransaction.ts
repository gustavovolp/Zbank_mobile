import type { Transaction } from '../entities';
import type { TransactionRepository } from '../TransactionRepository';
import { parseTransactionDraft, type TransactionDraft } from '../validation';

export class AddTransaction {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(uid: string, draft: TransactionDraft): Promise<Transaction> {
    const input = parseTransactionDraft(draft);
    return this.repository.add(uid, input);
  }
}
