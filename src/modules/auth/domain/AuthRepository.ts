import type { Observable } from 'rxjs';
import type { AuthUser } from './entities';

export interface AuthRepository {
  observeAuthState(): Observable<AuthUser | null>;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<AuthUser>;
  logout(): Promise<void>;
}
