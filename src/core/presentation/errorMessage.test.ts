import { describe, expect, it } from 'vitest';
import { DataAccessError, ValidationError } from '@/core/domain/errors';
import { AuthError } from '@/modules/auth/domain/AuthError';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('usa a mensagem de qualquer erro de domínio', () => {
    expect(getErrorMessage(new ValidationError({ valor: 'Valor inválido.' }))).toBe('Valor inválido.');
    expect(getErrorMessage(new AuthError('invalid-credentials'))).toBe('E-mail ou senha incorretos.');
  });

  it('explica erro de permissão de dados apontando para o README', () => {
    expect(getErrorMessage(new DataAccessError('permission-denied'))).toMatch(/regras de segurança/);
    expect(getErrorMessage(new DataAccessError('unavailable'))).toMatch(/indisponível/);
  });

  it('não vaza detalhes técnicos de erros desconhecidos nem códigos do Firebase crus', () => {
    expect(getErrorMessage(new Error('stack trace interno'))).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getErrorMessage({ code: 'permission-denied' })).toBe(DEFAULT_ERROR_MESSAGE);
    expect(getErrorMessage(new Error('x'), 'Falha ao carregar.')).toBe('Falha ao carregar.');
  });
});
