import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../errors';

/** Último middleware: convierte cualquier error en una respuesta JSON consistente. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
    });
    return;
  }

  // Errores del parser de JSON de Express
  const type = typeof err === 'object' && err !== null ? (err as { type?: string }).type : undefined;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'JSON inválido' } });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: { message: 'El cuerpo de la petición es demasiado grande' } });
    return;
  }

  // Cualquier otra cosa es un error nuestro: se registra, pero al cliente no se le filtran detalles.
  console.error(err);
  res.status(500).json({ error: { message: 'Error interno del servidor' } });
};
