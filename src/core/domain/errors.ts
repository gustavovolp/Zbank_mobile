export type FieldErrors = Record<string, string>;

export class ValidationError extends Error {
  readonly fieldErrors: FieldErrors;

  constructor(fieldErrors: FieldErrors, message?: string) {
    super(message ?? Object.values(fieldErrors)[0] ?? 'Dados inválidos.');
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}
