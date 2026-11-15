import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { Observable } from 'rxjs';
import type { AuthRepository } from '../domain/AuthRepository';
import type { AuthUser } from '../domain/entities';
import { mapFirebaseAuthError } from './firebaseAuthErrors';

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export class FirebaseAuthRepository implements AuthRepository {
  constructor(private readonly auth: Auth) {}

  observeAuthState(): Observable<AuthUser | null> {
    return new Observable<AuthUser | null>((subscriber) =>
      onAuthStateChanged(
        this.auth,
        (user) => subscriber.next(user ? toAuthUser(user) : null),
        (error) => subscriber.error(error)
      )
    );
  }

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(credential.user, { displayName: name }).catch(() => undefined);
      return toAuthUser(credential.user);
    } catch (error) {
      throw mapFirebaseAuthError(error);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
