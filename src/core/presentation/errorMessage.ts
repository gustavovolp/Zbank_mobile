import { ValidationError } from '@/core/domain/errors';
import { AuthError } from '@/modules/auth/domain/AuthError';

export const DEFAULT_ERROR_MESSAGE = 'Não foi possível completar a operação. Tente novamente.';

export function getErrorMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  if (error instanceof ValidationError || error instanceof AuthError) {
    return error.message;
  }

  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return 'Sem permissão para acessar os dados. Confira as regras de segurança do Firestore (veja o README).';
  }
  if (code === 'unavailable') {
    return 'Serviço indisponível. Verifique sua conexão e tente novamente.';
  }

  return fallback;
}
