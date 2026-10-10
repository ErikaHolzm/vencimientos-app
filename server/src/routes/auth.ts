import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config';
import { DuplicateEmailError, HttpError } from '../errors';
import { asyncHandler, parse } from '../http';
import { requireAuth } from '../middleware/auth';
import type { ReminderRepo, UserRepo } from '../repositories/types';
import { changePasswordSchema, deleteAccountSchema, loginSchema, registerSchema } from '../schemas';
import type { User } from '../types';

export function authRouter(users: UserRepo, reminders: ReminderRepo, config: AppConfig): Router {
  const router = Router();
  const auth = requireAuth(config.jwtSecret, users);

  // El token lleva la versión del usuario ("tv"): si cambia (logout, cambio de contraseña), deja de servir.
  const signToken = (user: User): string =>
    jwt.sign({ tv: user.tokenVersion }, config.jwtSecret, {
      algorithm: 'HS256',
      subject: user.id,
      expiresIn: config.jwtTtlSeconds,
    });

  const session = (user: User) => ({ token: signToken(user), user: { id: user.id, email: user.email } });

  // Hash falso para que "usuario que no existe" tarde lo mismo que "contraseña incorrecta".
  // Sin esto, midiendo el tiempo de respuesta se podría saber qué emails están registrados.
  const dummyHash = bcrypt.hashSync('contrasena-falsa-para-igualar-tiempos', config.bcryptCost);

  /** Carga al usuario autenticado y comprueba su contraseña. 403 (no 401) para no confundirlo con "sesión vencida". */
  const verifiedUser = async (userId: string | undefined, password: string): Promise<User> => {
    const user = userId ? await users.findById(userId) : null;
    if (!user) throw new HttpError(401, 'Autenticación requerida');
    if (!(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(403, 'La contraseña es incorrecta');
    return user;
  };

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const { email, password } = parse(registerSchema, req.body);
      const passwordHash = await bcrypt.hash(password, config.bcryptCost);
      try {
        const user = await users.create({ email, passwordHash });
        res.status(201).json(session(user));
      } catch (err) {
        if (err instanceof DuplicateEmailError) throw new HttpError(409, 'Ese email ya está registrado');
        throw err;
      }
    }),
  );

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const { email, password } = parse(loginSchema, req.body);
      const user = await users.findByEmail(email);
      const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);
      if (!user || !passwordOk) {
        // Mismo mensaje para "no existe" y "contraseña incorrecta".
        throw new HttpError(401, 'Credenciales inválidas');
      }
      res.json(session(user));
    }),
  );

  // Cierra sesión de verdad: el token usado (y cualquier otro emitido antes) deja de servir.
  router.post(
    '/logout',
    auth,
    asyncHandler(async (req, res) => {
      if (req.userId) await users.revokeTokens(req.userId);
      res.status(204).end();
    }),
  );

  // Cambia la contraseña, cierra las demás sesiones y devuelve un token nuevo para este dispositivo.
  router.post(
    '/change-password',
    auth,
    asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
      const user = await verifiedUser(req.userId, currentPassword);
      const updated = await users.changePassword(user.id, await bcrypt.hash(newPassword, config.bcryptCost));
      if (!updated) throw new HttpError(401, 'Autenticación requerida');
      res.json(session(updated));
    }),
  );

  // Borra la cuenta y todos sus recordatorios. Pide la contraseña para evitar borrados por accidente o con un token robado.
  router.delete(
    '/account',
    auth,
    asyncHandler(async (req, res) => {
      const { password } = parse(deleteAccountSchema, req.body);
      const user = await verifiedUser(req.userId, password);
      // Primero los recordatorios: si algo falla a medio camino, la cuenta sigue existiendo y se puede reintentar.
      await reminders.removeAllByUser(user.id);
      await users.remove(user.id);
      res.status(204).end();
    }),
  );

  return router;
}
