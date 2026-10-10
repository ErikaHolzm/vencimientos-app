import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Id del usuario autenticado (lo completa requireAuth). */
      userId?: string;
    }
  }
}

/** Exige un header "Authorization: Bearer <token>" válido y guarda el id del usuario en req.userId. */
export function requireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Autenticación requerida');
    }

    let userId: string;
    try {
      // Se fija el algoritmo: así no se aceptan tokens firmados con otro (ni "none").
      const payload = jwt.verify(header.slice('Bearer '.length), secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('Token sin sujeto');
      userId = payload.sub;
    } catch {
      throw new HttpError(401, 'Token inválido o vencido');
    }

    req.userId = userId;
    next();
  };
}
