import { z } from 'zod';
import { dueDateBounds } from './dateLimits';
import { CATEGORIES } from './types';

const email = z.string().trim().toLowerCase().email('Email inválido').max(254);

/**
 * Todos los esquemas son .strict(): si llega un campo que no esperamos se rechaza.
 * Así nadie puede "colar" campos extra (mass assignment).
 */
export const registerSchema = z
  .object({
    email,
    // bcrypt solo usa los primeros 72 bytes: limitamos para no truncar en silencio.
    password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres').max(72, 'Máximo 72 caracteres'),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1).max(128),
  })
  .strict();

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá el formato AAAA-MM-DD')
  .refine((s) => {
    const [y, m, d] = s.split('-').map(Number) as [number, number, number];
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, 'La fecha no existe');

export const reminderSchema = z
  .object({
    title: z.string().trim().min(1, 'El título es obligatorio').max(120, 'Máximo 120 caracteres'),
    category: z.enum(CATEGORIES),
    dueDate: isoDate.refine(
      (value) => {
        const { min, max } = dueDateBounds();
        return value >= min && value <= max; // AAAA-MM-DD se compara bien como texto
      },
      () => {
        const { min, max } = dueDateBounds();
        return { message: `La fecha debe estar entre ${min} y ${max}` };
      },
    ),
    remindDaysBefore: z
      .array(z.number().int().min(0).max(365))
      .max(6, 'Máximo 6 avisos')
      // Sin repetidos y de mayor a menor (30, 7, 1)
      .transform((days) => [...new Set(days)].sort((a, b) => b - a)),
  })
  .strict();
