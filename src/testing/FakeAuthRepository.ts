import { BehaviorSubject, type Observable } from 'rxjs';
import { AuthError } from '@/modules/auth/domain/AuthError';
import type { AuthRepository } from '@/modules/auth/domain/AuthRepository';
import type { AuthUser } from '@/modules/auth/domain/entities';

export const KNOWN_EMAIL = 'ana@zbank.com';
export const KNOWN_PASSWORD = 'Senha@123';

export class FakeAuthRepository implements AuthRepository {
  logoutCalls = 0;

  private readonly state = new BehaviorSubject<AuthUser | null>(null);

  observeAuthState(): Observable<AuthUser | null> {
    return this.state.asObservable();
  }

  async login(email: string, password: string): Promise<void> {
    if (email !== KNOWN_EMAIL || password !== KNOWN_PASSWORD) {
      throw new AuthError('invalid-credentials');
    }
    this.state.next({ uid: 'u1', email, displayName: 'Ana' });
  }

  async register(name: string, email: string): Promise<AuthUser> {
    if (email === KNOWN_EMAIL) throw new AuthError('email-in-use');
    const user: AuthUser = { uid: `u-${email}`, email, displayName: name };
    this.state.next(user);
    return user;
  }

  async logout(): Promise<void> {
    this.logoutCalls += 1;
    this.state.next(null);
  }
}
