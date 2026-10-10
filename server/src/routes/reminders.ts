import { Router } from 'express';
import { HttpError } from '../errors';
import { asyncHandler, parse } from '../http';
import { requireAuth } from '../middleware/auth';
import type { ReminderRepo, UserRepo } from '../repositories/types';
import { reminderSchema } from '../schemas';
import type { Reminder } from '../types';

/** Lo que se devuelve al cliente (sin userId). */
function toDto(r: Reminder) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    dueDate: r.dueDate,
    remindDaysBefore: r.remindDaysBefore,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function idParam(value: string | undefined): string {
  if (!value || value.length > 64) throw new HttpError(400, 'Id inválido');
  return value;
}

export function remindersRouter(reminders: ReminderRepo, users: UserRepo, jwtSecret: string): Router {
  const router = Router();
  router.use(requireAuth(jwtSecret, users));

  // userId sale SIEMPRE del token verificado, nunca del cuerpo ni de la URL.
  const currentUser = (userId: string | undefined): string => {
    if (!userId) throw new HttpError(401, 'Autenticación requerida');
    return userId;
  };

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const list = await reminders.listByUser(currentUser(req.userId));
      res.json({ reminders: list.map(toDto) });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const data = parse(reminderSchema, req.body);
      const created = await reminders.create(currentUser(req.userId), data);
      res.status(201).json({ reminder: toDto(created) });
    }),
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = idParam(req.params.id);
      const data = parse(reminderSchema, req.body);
      const updated = await reminders.update(currentUser(req.userId), id, data);
      // 404 tanto si no existe como si es de otro usuario: no se revela cuál de los dos es.
      if (!updated) throw new HttpError(404, 'Recordatorio no encontrado');
      res.json({ reminder: toDto(updated) });
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = idParam(req.params.id);
      const removed = await reminders.remove(currentUser(req.userId), id);
      if (!removed) throw new HttpError(404, 'Recordatorio no encontrado');
      res.status(204).end();
    }),
  );

  return router;
}
