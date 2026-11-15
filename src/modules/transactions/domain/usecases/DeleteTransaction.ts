import type { TransactionRepository } from '../TransactionRepository';

export class DeleteTransaction {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(uid: string, id: string): Promise<void> {
    await this.repository.remove(uid, id);
  }
}
