import { describe, expect, it } from 'vitest';
import { PASSWORD_MIN_LENGTH, validatePassword } from './passwordPolicy';

describe('validatePassword', () => {
  it('aceita senha com tamanho mínimo, maiúscula e caractere especial', () => {
    expect(validatePassword('Abc@12')).toBeNull();
  });

  it('rejeita senha curta', () => {
    expect(validatePassword('A@1')).toContain(String(PASSWORD_MIN_LENGTH));
  });

  it('rejeita senha sem letra maiúscula', () => {
    expect(validatePassword('senha@123')).toMatch(/maiúscula/);
  });

  it('rejeita senha sem caractere especial', () => {
    expect(validatePassword('Senha123')).toMatch(/especial/);
  });

  it('trata espaço e underscore como caractere especial', () => {
    expect(validatePassword('Senha 123')).toBeNull();
    expect(validatePassword('Senha_123')).toBeNull();
  });
});
