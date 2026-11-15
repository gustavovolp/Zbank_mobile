import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/core/domain/errors';
import { KNOWN_EMAIL, KNOWN_PASSWORD } from '@/testing/FakeAuthRepository';
import { createFakeDependencies } from '@/testing/createFakeDependencies';
import { AuthError } from '../AuthError';

const registerData = {
  name: ' Bia ',
  email: 'bia@zbank.com',
  password: 'Senha@123',
  confirmPassword: 'Senha@123',
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('LoginUser', () => {
  it('exige e-mail e senha', async () => {
    const { dependencies } = createFakeDependencies();
    await expect(dependencies.auth.login.execute('  ', '')).rejects.toBeInstanceOf(ValidationError);
  });

  it('propaga AuthError para credenciais inválidas', async () => {
    const { dependencies } = createFakeDependencies();
    await expect(dependencies.auth.login.execute(KNOWN_EMAIL, 'errada')).rejects.toMatchObject({
      code: 'invalid-credentials',
    });
  });

  it('autentica com credenciais corretas', async () => {
    const { dependencies } = createFakeDependencies();
    await dependencies.auth.login.execute(` ${KNOWN_EMAIL} `, KNOWN_PASSWORD);
  });
});

describe('RegisterUser', () => {
  it.each([
    [{ ...registerData, name: ' ' }, 'form'],
    [{ ...registerData, password: 'senha@123', confirmPassword: 'senha@123' }, 'password'],
    [{ ...registerData, confirmPassword: 'Outra@123' }, 'confirmPassword'],
  ])('rejeita dados inválidos (%#)', async (data, field) => {
    const { dependencies, authRepository } = createFakeDependencies();

    await expect(dependencies.auth.register.execute(data)).rejects.toMatchObject({
      fieldErrors: { [field]: expect.any(String) },
    });
    expect(authRepository.logoutCalls).toBe(0);
  });

  it('cria a conta (nome sem espaços) e popula dados de exemplo em segundo plano', async () => {
    const { dependencies, transactionRepository } = createFakeDependencies();

    const user = await dependencies.auth.register.execute(registerData);
    await flush();

    expect(user.displayName).toBe('Bia');
    expect(transactionRepository.addCalls).toBe(10);
  });

  it('não falha o cadastro se a criação dos dados de exemplo falhar', async () => {
    const { dependencies, transactionRepository } = createFakeDependencies();
    transactionRepository.add = async () => {
      throw new Error('permission-denied');
    };

    await expect(dependencies.auth.register.execute(registerData)).resolves.toMatchObject({ displayName: 'Bia' });
    await flush();
  });

  it('propaga erro quando o e-mail já existe', async () => {
    const { dependencies } = createFakeDependencies();
    await expect(
      dependencies.auth.register.execute({ ...registerData, email: KNOWN_EMAIL })
    ).rejects.toBeInstanceOf(AuthError);
  });
});

describe('LogoutUser', () => {
  it('encerra a sessão e apaga os dados locais', async () => {
    const { dependencies, authRepository, eraseCalls } = createFakeDependencies();

    await dependencies.auth.logout.execute();

    expect(authRepository.logoutCalls).toBe(1);
    expect(eraseCalls.count).toBe(1);
  });
});
