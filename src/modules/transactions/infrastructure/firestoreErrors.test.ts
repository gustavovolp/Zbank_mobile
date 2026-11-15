import { describe, expect, it } from 'vitest';
import { DataAccessError, ValidationError } from '@/core/domain/errors';
import { mapFirestoreError, translateFirestoreErrors } from './firestoreErrors';

describe('mapFirestoreError', () => {
  it('traduz códigos do Firestore para erros de domínio', () => {
    expect(mapFirestoreError({ code: 'permission-denied' })).toMatchObject({ code: 'permission-denied' });
    expect(mapFirestoreError({ code: 'unavailable' })).toMatchObject({ code: 'unavailable' });
  });

  it('usa "unknown" para qualquer outra falha, sem expor o erro original', () => {
    const error = mapFirestoreError(new Error('detalhe interno do SDK'));
    expect(error).toBeInstanceOf(DataAccessError);
    expect(error.message).not.toContain('SDK');
    expect(mapFirestoreError(null)).toBeInstanceOf(DataAccessError);
  });

  it('não reembrulha erros de domínio que já são traduzidos', () => {
    const original = new ValidationError({ x: 'y' });
    expect(mapFirestoreError(original)).toBe(original);
  });
});

describe('translateFirestoreErrors', () => {
  it('devolve o resultado em caso de sucesso', async () => {
    await expect(translateFirestoreErrors(async () => 42)).resolves.toBe(42);
  });

  it('converte a falha em DataAccessError', async () => {
    await expect(
      translateFirestoreErrors(async () => {
        throw { code: 'permission-denied' };
      })
    ).rejects.toMatchObject({ name: 'DataAccessError', code: 'permission-denied' });
  });
});
