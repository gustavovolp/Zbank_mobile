import { describe, expect, it } from 'vitest';
import { KNOWN_EMAIL, KNOWN_PASSWORD } from '@/testing/FakeAuthRepository';
import { createTestStore } from '@/testing/createTestStore';
import { authStateChanged, login, logout, register } from './authSlice';

describe('authSlice', () => {
  it('começa em "initializing" e reage às mudanças de estado de autenticação', () => {
    const { store } = createTestStore({ signedIn: false });
    expect(store.getState().auth).toEqual({ status: 'initializing', user: null });

    store.dispatch(authStateChanged({ uid: 'x', email: null, displayName: null }));
    expect(store.getState().auth.status).toBe('authenticated');

    store.dispatch(authStateChanged(null));
    expect(store.getState().auth).toEqual({ status: 'unauthenticated', user: null });
  });

  it('login com credenciais inválidas rejeita com mensagem amigável', async () => {
    const { store } = createTestStore({ signedIn: false });

    const result = await store.dispatch(login({ email: KNOWN_EMAIL, password: 'errada' }));

    expect(result.type).toBe('auth/login/rejected');
    expect(result.payload).toBe('E-mail ou senha incorretos.');
  });

  it('login válido conclui sem erro', async () => {
    const { store } = createTestStore({ signedIn: false });
    const result = await store.dispatch(login({ email: KNOWN_EMAIL, password: KNOWN_PASSWORD }));
    expect(result.type).toBe('auth/login/fulfilled');
  });

  it('register válido autentica o usuário no estado, já com o nome', async () => {
    const { store } = createTestStore({ signedIn: false });

    await store.dispatch(
      register({ name: 'Caio', email: 'caio@zbank.com', password: 'Senha@123', confirmPassword: 'Senha@123' })
    );

    expect(store.getState().auth).toMatchObject({ status: 'authenticated', user: { displayName: 'Caio' } });
  });

  it('register com senha fraca rejeita com a regra violada', async () => {
    const { store } = createTestStore({ signedIn: false });

    const result = await store.dispatch(
      register({ name: 'Caio', email: 'caio@zbank.com', password: 'fraca', confirmPassword: 'fraca' })
    );

    expect(result.type).toBe('auth/register/rejected');
    expect(result.payload).toMatch(/pelo menos 6 caracteres/);
  });

  it('logout encerra a sessão e apaga os dados locais', async () => {
    const { store, authRepository, eraseCalls } = createTestStore();

    await store.dispatch(logout());

    expect(authRepository.logoutCalls).toBe(1);
    expect(eraseCalls.count).toBe(1);
  });
});
