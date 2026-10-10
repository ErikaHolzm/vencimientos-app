/** Error con código HTTP. El manejador de errores lo convierte en una respuesta JSON. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Lo lanzan los repositorios cuando el email ya existe (índice único). */
export class DuplicateEmailError extends Error {
  constructor() {
    super('El email ya está registrado');
    this.name = 'DuplicateEmailError';
  }
}
