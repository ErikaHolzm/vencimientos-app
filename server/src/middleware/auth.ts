import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../errors';
import type { UserRepo } from '../repositories/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Id del usuario autenticado (lo completa requireAuth). */
      userId?: string;
    }
  }
}

/**
 * Exige un header "Authorization: Bearer <token>" válido y guarda el id del usuario en req.userId.
 * Además de la firma, comprueba contra la base que el token no fue revocado: cada usuario tiene una
 * "versión de token" que sube al cerrar sesión o cambiar la contraseña, y el token lleva la versión
 * con la que se emitió. Si no coinciden (o el usuario ya no existe), se rechaza.
 */
export function requireAuth(secret: string, users: UserRepo): RequestHandler {
  return (req, _res, next) => {
    void (async () => {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        throw new HttpError(401, 'Autenticación requerida');
      }

      let userId: string;
      let version: unknown;
      try {
        // Se fija el algoritmo: así no se aceptan tokens firmados con otro (ni "none").
        const payload = jwt.verify(header.slice('Bearer '.length), secret, { algorithms: ['HS256'] });
        if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('Token sin sujeto');
        userId = payload.sub;
        version = payload.tv;
      } catch {
        throw new HttpError(401, 'Token inválido o vencido');
      }

      const user = await users.findById(userId);
      if (!user || user.tokenVersion !== version) {
        throw new HttpError(401, 'Token inválido o vencido');
      }

      req.userId = userId;
    })().then(() => next(), next);
  };
}
