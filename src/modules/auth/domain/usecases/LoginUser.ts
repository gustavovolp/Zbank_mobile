import { ValidationError } from '@/core/domain/errors';
import type { AuthRepository } from '../AuthRepository';

export class LoginUser {
  constructor(private readonly repository: AuthRepository) {}

  async execute(email: string, password: string): Promise<void> {
    if (!email.trim() || !password) {
      throw new ValidationError({ form: 'Informe e-mail e senha para continuar.' });
    }
    await this.repository.login(email.trim(), password);
  }
}
