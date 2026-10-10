import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import { HttpError } from './errors';

/** Express 4 no captura promesas rechazadas: este envoltorio las manda al manejador de errores. */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

/** Valida datos externos con un esquema zod. Si no cumplen, responde 400 con el detalle. */
export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(
      400,
      'Datos inválidos',
      result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    );
  }
  return result.data;
}
