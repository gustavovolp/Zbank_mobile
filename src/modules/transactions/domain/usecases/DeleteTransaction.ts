import { ValidationError } from '@/core/domain/errors';
import type { TransactionRepository } from '../TransactionRepository';

export class DeleteTransaction {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(uid: string, id: string): Promise<void> {
    if (!id.trim()) {
      throw new ValidationError({ id: 'Transação inválida.' });
    }
    await this.repository.remove(uid, id);
  }
}
