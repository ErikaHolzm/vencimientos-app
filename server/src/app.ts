import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { AppConfig } from './config';
import { HttpError } from './errors';
import { errorHandler } from './middleware/error';
import type { ReminderRepo, UserRepo } from './repositories/types';
import { authRouter } from './routes/auth';
import { remindersRouter } from './routes/reminders';

export interface AppDeps {
  users: UserRepo;
  reminders: ReminderRepo;
  config: AppConfig;
}

/** Arma la app Express. No abre puertos ni se conecta a la base: eso lo hace index.ts. */
export function createApp({ users, reminders, config }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  // Si la API corre detrás de un proxy (Render, Railway...), hay que decirlo para ver la IP real.
  if (config.trustProxyHops > 0) app.set('trust proxy', config.trustProxyHops);

  app.use(helmet());
  // La app móvil no usa CORS. Solo se habilita si se configuran orígenes web explícitos.
  if (config.corsOrigins.length > 0) app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  const WINDOW_MS = 15 * 60 * 1000;
  const passThrough: RequestHandler = (_req, _res, next) => next();
  const globalLimiter = config.rateLimitEnabled
    ? rateLimit({ windowMs: WINDOW_MS, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false })
    : passThrough;
  // Más estricto en login/registro para frenar la fuerza bruta de contraseñas.
  const authLimiter = config.rateLimitEnabled
    ? rateLimit({
        windowMs: WINDOW_MS,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { error: { message: 'Demasiados intentos. Probá de nuevo más tarde.' } },
      })
    : passThrough;

  app.use(globalLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authLimiter, authRouter(users, config));
  app.use('/api/reminders', remindersRouter(reminders, config.jwtSecret));

  app.use(() => {
    throw new HttpError(404, 'Ruta no encontrada');
  });
  app.use(errorHandler);

  return app;
}
