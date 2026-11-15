import { describe, expect, it } from 'vitest';
import { mapFirebaseAuthError } from './firebaseAuthErrors';

describe('mapFirebaseAuthError', () => {
  it.each([
    ['auth/invalid-email', 'invalid-email'],
    ['auth/user-not-found', 'invalid-credentials'],
    ['auth/wrong-password', 'invalid-credentials'],
    ['auth/invalid-credential', 'invalid-credentials'],
    ['auth/email-already-in-use', 'email-in-use'],
    ['auth/weak-password', 'weak-password'],
    ['auth/network-request-failed', 'network'],
  ])('traduz %s para %s', (firebaseCode, expected) => {
    expect(mapFirebaseAuthError({ code: firebaseCode }).code).toBe(expected);
  });

  it('usa "unknown" para códigos desconhecidos ou erros sem código', () => {
    expect(mapFirebaseAuthError({ code: 'auth/outra-coisa' }).code).toBe('unknown');
    expect(mapFirebaseAuthError(new Error('boom')).code).toBe('unknown');
    expect(mapFirebaseAuthError(null).code).toBe('unknown');
  });

  it('não diferencia "usuário não existe" de "senha errada" (evita enumeração de contas)', () => {
    expect(mapFirebaseAuthError({ code: 'auth/user-not-found' }).message).toBe(
      mapFirebaseAuthError({ code: 'auth/wrong-password' }).message
    );
  });
});
