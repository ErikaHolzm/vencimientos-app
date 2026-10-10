import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app';
import { loadConfig } from './config';
import { ensureIndexes, MongoReminderRepo, MongoUserRepo } from './repositories/mongo';

async function main(): Promise<void> {
  const config = loadConfig();

  // Elimina operadores tipo { $ne: ... } de los filtros: defensa extra contra inyección NoSQL.
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(config.mongoUri);
  await ensureIndexes();

  const app = createApp({ users: new MongoUserRepo(), reminders: new MongoReminderRepo(), config });
  const server = app.listen(config.port, () => {
    console.log(`API escuchando en el puerto ${config.port}`);
  });

  const shutdown = (): void => {
    server.close(() => {
      mongoose.disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
