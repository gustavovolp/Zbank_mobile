import { DomainError } from '@/core/domain/errors';

export const DEFAULT_ERROR_MESSAGE = 'Não foi possível completar a operação. Tente novamente.';

export function getErrorMessage(error: unknown, fallback: string = DEFAULT_ERROR_MESSAGE): string {
  return error instanceof DomainError ? error.message : fallback;
}
