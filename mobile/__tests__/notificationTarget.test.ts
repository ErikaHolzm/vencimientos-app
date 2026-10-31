import { reminderIdFromData } from '../src/lib/notificationTarget';

describe('reminderIdFromData', () => {
  it('devuelve el id cuando viene como texto', () => {
    expect(reminderIdFromData({ reminderId: 'abc123' })).toBe('abc123');
  });

  it('devuelve null si no hay datos o no son un objeto', () => {
    expect(reminderIdFromData(undefined)).toBeNull();
    expect(reminderIdFromData(null)).toBeNull();
    expect(reminderIdFromData('abc123')).toBeNull();
    expect(reminderIdFromData(42)).toBeNull();
  });

  it('devuelve null si el id falta, está vacío o no es un texto', () => {
    expect(reminderIdFromData({})).toBeNull();
    expect(reminderIdFromData({ reminderId: '' })).toBeNull();
    expect(reminderIdFromData({ reminderId: 123 })).toBeNull();
    expect(reminderIdFromData({ reminderId: { $ne: null } })).toBeNull();
  });
});
