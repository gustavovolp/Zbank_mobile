export const TIPOS_ANEXO_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const TAMANHO_MAXIMO_ANEXO = 5 * 1024 * 1024;

export type TipoArquivoPermitido = (typeof TIPOS_ANEXO_PERMITIDOS)[number];

export interface ArquivoSelecionado {
  uri: string;
  nome: string;
  tipoArquivo: string;
  tamanho: number;
}

export function isTipoArquivoPermitido(tipo: string): tipo is TipoArquivoPermitido {
  return (TIPOS_ANEXO_PERMITIDOS as readonly string[]).includes(tipo);
}

export function validarArquivoAnexo(arquivo: ArquivoSelecionado): string | null {
  if (!isTipoArquivoPermitido(arquivo.tipoArquivo)) {
    return 'Formato não suportado. Envie um arquivo JPG, PNG ou PDF.';
  }
  if (arquivo.tamanho > TAMANHO_MAXIMO_ANEXO) {
    return 'Arquivo muito grande. O tamanho máximo é 5MB.';
  }
  return null;
}

export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
