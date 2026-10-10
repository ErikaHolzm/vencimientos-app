import { dueDateBounds } from '../src/dateLimits';

describe('dueDateBounds', () => {
  it('permite hasta un año atrás y 50 años adelante, con 1 día de margen', () => {
    expect(dueDateBounds(new Date(Date.UTC(2026, 9, 9, 12)))).toEqual({ min: '2025-10-08', max: '2076-10-10' });
  });

  it('cruza bien el fin de año', () => {
    expect(dueDateBounds(new Date(Date.UTC(2026, 0, 1)))).toEqual({ min: '2024-12-31', max: '2076-01-02' });
  });

  it('tiene en cuenta los años bisiestos', () => {
    // Entre el 1 mar 2027 y el 1 mar 2028 hay 366 días (2028 es bisiesto).
    expect(dueDateBounds(new Date(Date.UTC(2028, 2, 1)))).toEqual({ min: '2027-03-01', max: '2078-03-02' });
  });
});
