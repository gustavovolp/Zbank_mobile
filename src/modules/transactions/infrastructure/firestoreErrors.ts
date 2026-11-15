import { DataAccessError, DomainError } from '@/core/domain/errors';

export function mapFirestoreError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;

  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied') return new DataAccessError('permission-denied');
  if (code === 'unavailable') return new DataAccessError('unavailable');
  return new DataAccessError('unknown');
}

export async function translateFirestoreErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapFirestoreError(error);
  }
}
