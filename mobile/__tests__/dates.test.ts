import {
  addDays,
  addYears,
  daysUntil,
  dueDateRange,
  formatDate,
  formatToday,
  parseISO,
  suggestRenewalDate,
  toISO,
} from '../src/lib/dates';

const NOW = new Date(2026, 9, 9, 19, 32); // viernes 9 de octubre de 2026, 19:32

describe('dates', () => {
  it('toISO y parseISO son inversas', () => {
    expect(toISO(parseISO('2026-03-05'))).toBe('2026-03-05');
  });

  it('daysUntil cuenta días de calendario, sin importar la hora', () => {
    expect(daysUntil('2026-10-16', NOW)).toBe(7);
    expect(daysUntil('2026-10-10', NOW)).toBe(1);
    expect(daysUntil('2026-10-09', NOW)).toBe(0);
    expect(daysUntil('2026-10-07', NOW)).toBe(-2);
  });

  it('daysUntil funciona al cruzar de año', () => {
    expect(daysUntil('2027-01-01', new Date(2026, 11, 31, 23, 59))).toBe(1);
  });

  it('addDays cruza meses y años', () => {
    expect(toISO(addDays(parseISO('2026-12-30'), 3))).toBe('2027-01-02');
    expect(toISO(addDays(parseISO('2026-03-01'), -1))).toBe('2026-02-28');
  });

  it('formatDate usa mes abreviado en español', () => {
    expect(formatDate('2026-12-15')).toBe('15 dic 2026');
    expect(formatDate('2027-01-02')).toBe('2 ene 2027');
  });

  it('dueDateRange permite hasta un año atrás y 50 años adelante', () => {
    const { min, max } = dueDateRange(NOW);
    expect(toISO(min)).toBe('2025-10-09');
    expect(toISO(max)).toBe('2076-10-09');
  });

  it('addYears no se pasa de mes con el 29 de febrero', () => {
    expect(toISO(addYears(parseISO('2028-02-29'), 1))).toBe('2029-02-28');
    expect(toISO(addYears(parseISO('2028-02-29'), 4))).toBe('2032-02-29');
    expect(toISO(addYears(parseISO('2026-10-09'), 1))).toBe('2027-10-09');
  });

  it('suggestRenewalDate suma un año al vencimiento si todavía no pasó', () => {
    expect(suggestRenewalDate('2026-12-15', NOW)).toBe('2027-12-15');
  });

  it('suggestRenewalDate parte de hoy si ya venció', () => {
    expect(suggestRenewalDate('2026-10-07', NOW)).toBe('2027-10-09');
    expect(suggestRenewalDate('2024-01-01', NOW)).toBe('2027-10-09');
  });

  it('formatToday arma el encabezado', () => {
    expect(formatToday(NOW)).toBe('Viernes 9 de octubre');
  });
});
