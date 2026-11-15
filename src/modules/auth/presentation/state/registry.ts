import type { LoginUser } from '../../domain/usecases/LoginUser';
import type { LogoutUser } from '../../domain/usecases/LogoutUser';
import type { ObserveAuthState } from '../../domain/usecases/ObserveAuthState';
import type { RegisterUser } from '../../domain/usecases/RegisterUser';
import type { AuthState } from './authSlice';

export interface AuthDependencies {
  auth: {
    observeAuthState: ObserveAuthState;
    login: LoginUser;
    register: RegisterUser;
    logout: LogoutUser;
  };
}

declare module '@/core/presentation/store/registry' {
  interface StateRegistry {
    auth: AuthState;
  }

  interface DependenciesRegistry extends AuthDependencies {}
}
