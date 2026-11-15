import type { Observable } from 'rxjs';
import type { AuthRepository } from '../AuthRepository';
import type { AuthUser } from '../entities';

export class ObserveAuthState {
  constructor(private readonly repository: AuthRepository) {}

  execute(): Observable<AuthUser | null> {
    return this.repository.observeAuthState();
  }
}
