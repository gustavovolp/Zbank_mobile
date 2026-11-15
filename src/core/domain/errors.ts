export type FieldErrors = Record<string, string>;

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  readonly fieldErrors: FieldErrors;

  constructor(fieldErrors: FieldErrors, message?: string) {
    super(message ?? Object.values(fieldErrors)[0] ?? 'Dados inválidos.');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export type DataAccessErrorCode = 'permission-denied' | 'unavailable' | 'unknown';

const DATA_ACCESS_MESSAGES: Record<DataAccessErrorCode, string> = {
  'permission-denied':
    'Sem permissão para acessar os dados. Confira as regras de segurança do banco de dados (veja o README).',
  unavailable: 'Serviço indisponível. Verifique sua conexão e tente novamente.',
  unknown: 'Não foi possível acessar os dados. Tente novamente.',
};

export class DataAccessError extends DomainError {
  readonly code: DataAccessErrorCode;

  constructor(code: DataAccessErrorCode) {
    super(DATA_ACCESS_MESSAGES[code]);
    this.name = 'DataAccessError';
    this.code = code;
  }
}
