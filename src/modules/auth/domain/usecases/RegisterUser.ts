import { ValidationError } from '@/core/domain/errors';
import type { AuthRepository } from '../AuthRepository';
import type { AuthUser, RegisterData } from '../entities';
import type { NewUserInitializer } from '../NewUserInitializer';
import { validatePassword } from '../passwordPolicy';

export class RegisterUser {
  constructor(
    private readonly repository: AuthRepository,
    private readonly newUserInitializer: NewUserInitializer
  ) {}

  async execute(data: RegisterData): Promise<AuthUser> {
    if (!data.name.trim() || !data.email.trim() || !data.password) {
      throw new ValidationError({ form: 'Preencha todos os campos para criar sua conta.' });
    }

    const passwordError = validatePassword(data.password);
    if (passwordError) {
      throw new ValidationError({ password: passwordError });
    }

    if (data.password !== data.confirmPassword) {
      throw new ValidationError({ confirmPassword: 'As senhas não coincidem.' });
    }

    const user = await this.repository.register(data.name.trim(), data.email.trim(), data.password);

    this.newUserInitializer.initialize(user.uid).catch(() => undefined);

    return user;
  }
}
