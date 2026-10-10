import { addDays, toISO } from '../src/lib/dates';
import { MAX_SCHEDULED, planNotifications } from '../src/lib/notificationPlan';
import type { Reminder } from '../src/types';

const NOW = new Date(2026, 9, 9, 19, 32); // 9 oct 2026, 19:32

function reminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'r1',
    title: 'Renovar libreta de conducir',
    category: 'licencia',
    dueDate: '2026-10-16',
    remindDaysBefore: [7, 1, 0],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('planNotifications', () => {
  it('omite los avisos que ya pasaron y deja los futuros a las 9:00', () => {
    // El aviso de "7 días antes" era el 9 oct a las 9:00: ya pasó (son las 19:32).
    const plan = planNotifications([reminder()], NOW);

    expect(plan).toHaveLength(2);
    expect(plan[0]?.date).toEqual(new Date(2026, 9, 15, 9, 0, 0));
    expect(plan[0]?.body).toBe('Vence mañana.');
    expect(plan[1]?.date).toEqual(new Date(2026, 9, 16, 9, 0, 0));
    expect(plan[1]?.body).toBe('Vence hoy.');
  });

  it('usa el título del recordatorio y la fecha en el texto', () => {
    const plan = planNotifications([reminder({ remindDaysBefore: [10], dueDate: '2026-11-01' })], NOW);

    expect(plan[0]?.title).toBe('Renovar libreta de conducir');
    expect(plan[0]?.body).toBe('Vence en 10 días (1 nov 2026).');
  });

  it('ordena por fecha entre varios recordatorios', () => {
    const plan = planNotifications(
      [
        reminder({ id: 'tarde', dueDate: '2026-12-01', remindDaysBefore: [1] }),
        reminder({ id: 'temprano', dueDate: '2026-10-20', remindDaysBefore: [1] }),
      ],
      NOW,
    );

    expect(plan.map((p) => p.reminderId)).toEqual(['temprano', 'tarde']);
  });

  it('no programa nada si el vencimiento ya pasó', () => {
    expect(planNotifications([reminder({ dueDate: '2026-10-01' })], NOW)).toEqual([]);
  });

  it('respeta el máximo de notificaciones pendientes y se queda con las más próximas', () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      reminder({ id: `r${i}`, dueDate: toISO(addDays(NOW, i + 5)), remindDaysBefore: [1] }),
    );
    const plan = planNotifications(many, NOW);

    expect(plan).toHaveLength(MAX_SCHEDULED);
    expect(plan[0]?.reminderId).toBe('r0');
  });
});
