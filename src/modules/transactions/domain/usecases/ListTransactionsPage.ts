import { ValidationError } from '@/core/domain/errors';
import type { ListPageParams, TransactionPage } from '../entities';
import type { ListPageOptions, TransactionRepository } from '../TransactionRepository';
import { validateFilterRange } from '../validation';

export class ListTransactionsPage {
  constructor(private readonly repository: TransactionRepository) {}

  async execute(uid: string, params: ListPageParams, options?: ListPageOptions): Promise<TransactionPage> {
    const errors = validateFilterRange(params.filters);
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }
    return this.repository.listPage(uid, params, options);
  }
}
