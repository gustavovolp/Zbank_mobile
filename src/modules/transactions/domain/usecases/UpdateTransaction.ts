import type { TransactionRepository } from '../TransactionRepository';
import { parseTransactionDraft, type TransactionDraft } from '../validation';

export class UpdateTransaction {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(uid: string, id: string, draft: TransactionDraft): Promise<void> {
    const input = parseTransactionDraft(draft);
    await this.repository.update(uid, id, input);
  }
}
