export const PASSWORD_MIN_LENGTH = 6;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_SPECIAL_CHARACTER = /[^A-Za-z0-9]/;

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (!HAS_UPPERCASE.test(password)) {
    return 'A senha precisa ter pelo menos uma letra maiúscula.';
  }
  if (!HAS_SPECIAL_CHARACTER.test(password)) {
    return 'A senha precisa ter pelo menos um caractere especial (ex: !@#$%).';
  }
  return null;
}
