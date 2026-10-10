import express, { type RequestHandler } from 'express';
import mongoose from 'mongoose';
import { createApp } from './src/app';
import { loadConfig } from './src/config';
import { ensureIndexes, MongoReminderRepo, MongoUserRepo } from './src/repositories/mongo';

/**
 * Punto de entrada para Vercel (en tu computadora se sigue usando src/index.ts).
 *
 * Vercel ejecuta la API como una función que se "despierta" por pedido, así que no hay un servidor
 * siempre encendido: la primera petición abre la conexión a MongoDB y las siguientes la reutilizan
 * mientras la función siga viva. Esta app exterior solo se encarga de eso y le pasa cada petición
 * a la app real (createApp), que es la misma que usan los tests.
 */
type App = ReturnType<typeof createApp>;

let ready: Promise<App> | null = null;

function connect(): Promise<App> {
  ready ??= (async () => {
    const config = loadConfig();
    mongoose.set('sanitizeFilter', true);
    // Pocas conexiones por instancia: cada instancia de la función abre las suyas.
    await mongoose.connect(config.mongoUri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    await ensureIndexes();
    return createApp({ users: new MongoUserRepo(), reminders: new MongoReminderRepo(), config });
  })().catch((err: unknown) => {
    ready = null; // si falló, la próxima petición vuelve a intentar
    throw err;
  });
  return ready;
}

const handoff: RequestHandler = (req, res, next) => {
  connect()
    .then((app) => app(req, res, next))
    .catch((err: unknown) => {
      console.error(err);
      res.status(500).json({ error: { message: 'Error interno del servidor' } });
    });
};

const gateway = express();
gateway.use(handoff);

export default gateway;
