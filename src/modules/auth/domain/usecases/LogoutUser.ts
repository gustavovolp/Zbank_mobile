import type { LocalDataEraser } from '@/core/domain/ports';
import type { AuthRepository } from '../AuthRepository';

export class LogoutUser {
  constructor(
    private readonly repository: AuthRepository,
    private readonly localData: LocalDataEraser
  ) {}

  async execute(): Promise<void> {
    await this.repository.logout();
    await this.localData.eraseAll().catch(() => undefined);
  }
}
