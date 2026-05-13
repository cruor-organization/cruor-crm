/**
 * AppError base + subclasses (§6, Hard Invariants do CLAUDE.md).
 *
 * Contrato: cada erro tem `code` estável (consumido pelo frontend para i18n)
 * e `httpStatus` que o middleware Express mapeia.
 */

export type ErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details: ErrorDetails;

  constructor(code: string, message: string, httpStatus: number, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): { code: string; message: string; details?: ErrorDetails } {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class ValidationError extends AppError {
  constructor(code: string, message = code, details?: ErrorDetails) {
    super(code, message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Sessão inválida ou ausente.') {
    super(code, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(code: string, message = code, details?: ErrorDetails) {
    super(code, message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message = code, details?: ErrorDetails) {
    super(code, message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message = code, details?: ErrorDetails) {
    super(code, message, 409, details);
  }
}

export class IntegrationError extends AppError {
  constructor(code: string, message = code, details?: ErrorDetails) {
    super(code, message, 502, details);
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
