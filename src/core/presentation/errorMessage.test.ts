import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/core/domain/errors';
import { AuthError } from '@/modules/auth/domain/AuthError';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('usa a mensagem de erros de domínio', () => {
    expect(getErrorMessage(new ValidationError({ valor: 'Valor inválido.' }))).toBe('Valor inválido.');
    expect(getErrorMessage(new AuthError('invalid-credentials'))).toBe('E-mail ou senha incorretos.');
  });

  it('explica erros de permissão do Firestore apontando para o README', () => {
    expect(getErrorMessage({ code: 'permission-denied' })).toMatch(/regras de segurança/);
  });

  it('não vaza detalhes técnicos de erros desconhecidos', () => {
    expect(getErrorMessage(new Error('stack trace interno'))).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getErrorMessage(new Error('x'), 'Falha ao carregar.')).toBe('Falha ao carregar.');
  });
});
