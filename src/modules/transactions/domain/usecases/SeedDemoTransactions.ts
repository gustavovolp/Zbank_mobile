import type { Clock } from '@/core/domain/ports';
import { buildDemoTransactions } from '../demoTransactions';
import type { TransactionRepository } from '../TransactionRepository';

export class SeedDemoTransactions {
  constructor(
    private readonly repository: TransactionRepository,
    private readonly clock: Clock
  ) {}

  async execute(uid: string): Promise<void> {
    const demo = buildDemoTransactions(this.clock.now());
    await Promise.all(demo.map(({ input, createdAt }) => this.repository.add(uid, input, createdAt)));
  }
}
