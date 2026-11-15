import { DomainError } from '@/core/domain/errors';

export type AuthErrorCode =
  | 'invalid-email'
  | 'invalid-credentials'
  | 'email-in-use'
  | 'weak-password'
  | 'network'
  | 'unknown';

const MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-email': 'E-mail inválido.',
  'invalid-credentials': 'E-mail ou senha incorretos.',
  'email-in-use': 'Já existe uma conta com este e-mail.',
  'weak-password': 'A senha informada é fraca demais.',
  network: 'Sem conexão. Verifique sua internet e tente novamente.',
  unknown: 'Não foi possível completar a operação. Tente novamente.',
};

export class AuthError extends DomainError {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(MESSAGES[code]);
    this.name = 'AuthError';
    this.code = code;
  }
}
