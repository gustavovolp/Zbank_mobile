export const SENHA_TAMANHO_MINIMO = 6;

const TEM_MAIUSCULA = /[A-Z]/;
const TEM_CARACTERE_ESPECIAL = /[^A-Za-z0-9]/;

export function validarSenha(senha: string): string | null {
  if (senha.length < SENHA_TAMANHO_MINIMO) {
    return `A senha precisa ter pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`;
  }
  if (!TEM_MAIUSCULA.test(senha)) {
    return 'A senha precisa ter pelo menos uma letra maiúscula.';
  }
  if (!TEM_CARACTERE_ESPECIAL.test(senha)) {
    return 'A senha precisa ter pelo menos um caractere especial (ex: !@#$%).';
  }
  return null;
}
