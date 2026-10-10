import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config';
import { DuplicateEmailError, HttpError } from '../errors';
import { asyncHandler, parse } from '../http';
import type { UserRepo } from '../repositories/types';
import { loginSchema, registerSchema } from '../schemas';

export function authRouter(users: UserRepo, config: AppConfig): Router {
  const router = Router();

  const signToken = (userId: string): string =>
    jwt.sign({}, config.jwtSecret, { algorithm: 'HS256', subject: userId, expiresIn: config.jwtTtlSeconds });

  // Hash falso para que "usuario que no existe" tarde lo mismo que "contraseña incorrecta".
  // Sin esto, midiendo el tiempo de respuesta se podría saber qué emails están registrados.
  const dummyHash = bcrypt.hashSync('contrasena-falsa-para-igualar-tiempos', config.bcryptCost);

  router.post(
    '/register',
    asyncHandler(async (req, res) => {
      const { email, password } = parse(registerSchema, req.body);
      const passwordHash = await bcrypt.hash(password, config.bcryptCost);
      try {
        const user = await users.create({ email, passwordHash });
        res.status(201).json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
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
      res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
    }),
  );

  return router;
}
