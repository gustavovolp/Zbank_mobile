import { AuthError, type AuthErrorCode } from '../domain/AuthError';

const CODE_MAP: Record<string, AuthErrorCode> = {
  'auth/invalid-email': 'invalid-email',
  'auth/user-not-found': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/invalid-credential': 'invalid-credentials',
  'auth/email-already-in-use': 'email-in-use',
  'auth/weak-password': 'weak-password',
  'auth/network-request-failed': 'network',
};

export function mapFirebaseAuthError(error: unknown): AuthError {
  const code = (error as { code?: string } | null)?.code ?? '';
  return new AuthError(CODE_MAP[code] ?? 'unknown');
}
