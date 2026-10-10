import { countdownHero, countdownTile, dueText, getStatus, matchesFilter } from '../src/lib/status';

describe('getStatus', () => {
  it.each([
    [-1, 'overdue'],
    [0, 'urgent'],
    [14, 'urgent'],
    [15, 'soon'],
    [60, 'soon'],
    [61, 'ok'],
    [400, 'ok'],
  ])('%i días → %s', (days, expected) => {
    expect(getStatus(days).key).toBe(expected);
  });
});

describe('countdownTile', () => {
  it('muestra días, hoy, atrasado y meses', () => {
    expect(countdownTile(12)).toEqual({ value: '12', unit: 'días' });
    expect(countdownTile(1)).toEqual({ value: '1', unit: 'día' });
    expect(countdownTile(0)).toEqual({ value: '0', unit: 'hoy' });
    expect(countdownTile(-3)).toEqual({ value: '3', unit: 'atrasado' });
    expect(countdownTile(145)).toEqual({ value: '5', unit: 'meses' });
  });
});

describe('countdownHero', () => {
  it('arma el texto de la tarjeta principal', () => {
    expect(countdownHero(12)).toEqual({ value: '12', unit: 'días para vencer' });
    expect(countdownHero(1)).toEqual({ value: '1', unit: 'día para vencer' });
    expect(countdownHero(0)).toEqual({ value: 'Hoy', unit: '' });
    expect(countdownHero(-2)).toEqual({ value: '2', unit: 'días de atraso' });
  });
});

describe('dueText', () => {
  it('describe el vencimiento en palabras', () => {
    expect(dueText(-1)).toBe('Venció hace 1 día');
    expect(dueText(-5)).toBe('Venció hace 5 días');
    expect(dueText(0)).toBe('Vence hoy');
    expect(dueText(1)).toBe('Vence mañana');
    expect(dueText(12)).toBe('Faltan 12 días');
    expect(dueText(145)).toBe('Faltan unos 5 meses');
  });
});

describe('matchesFilter', () => {
  it('reparte los vencimientos sin solaparse', () => {
    expect(matchesFilter('urgent', -5)).toBe(true);
    expect(matchesFilter('urgent', 14)).toBe(true);
    expect(matchesFilter('urgent', 15)).toBe(false);
    expect(matchesFilter('upcoming', 15)).toBe(true);
    expect(matchesFilter('upcoming', 60)).toBe(true);
    expect(matchesFilter('later', 60)).toBe(false);
    expect(matchesFilter('later', 61)).toBe(true);
    expect(matchesFilter('all', 9999)).toBe(true);
  });
});
