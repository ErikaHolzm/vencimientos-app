export type StatusKey = 'overdue' | 'urgent' | 'soon' | 'ok';
export type Filter = 'all' | 'urgent' | 'upcoming' | 'later';

export interface Status {
  key: StatusKey;
  label: string;
  /** Colores sobre fondo claro (tarjetas) */
  bg: string;
  fg: string;
  /** Colores sobre el fondo oscuro de la tarjeta principal */
  heroBg: string;
  heroFg: string;
}

export const URGENT_DAYS = 14;
export const SOON_DAYS = 60;

const STATUSES: Record<StatusKey, Status> = {
  overdue: { key: 'overdue', label: 'Vencido', bg: '#FDECEA', fg: '#B42318', heroBg: '#FF9C94', heroFg: '#4A0A06' },
  urgent: { key: 'urgent', label: 'Urgente', bg: '#FFEDD5', fg: '#9A3412', heroBg: '#FFC27A', heroFg: '#3B2000' },
  soon: { key: 'soon', label: 'Próximo', bg: '#FBF1C7', fg: '#7A5200', heroBg: '#F5DE7E', heroFg: '#3A2E00' },
  ok: { key: 'ok', label: 'Al día', bg: '#DDF3EA', fg: '#0B6B50', heroBg: '#7FD8B8', heroFg: '#05382A' },
};

export function getStatus(days: number): Status {
  if (days < 0) return STATUSES.overdue;
  if (days <= URGENT_DAYS) return STATUSES.urgent;
  if (days <= SOON_DAYS) return STATUSES.soon;
  return STATUSES.ok;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export interface Countdown {
  value: string;
  unit: string;
}

/** Número y unidad para el cuadro chico de cada tarjeta. */
export function countdownTile(days: number): Countdown {
  if (days < 0) return { value: String(-days), unit: 'atrasado' };
  if (days === 0) return { value: '0', unit: 'hoy' };
  if (days < 100) return { value: String(days), unit: plural(days, 'día', 'días') };
  const months = Math.round(days / 30);
  return { value: String(months), unit: plural(months, 'mes', 'meses') };
}

/** Número y texto para la tarjeta principal. */
export function countdownHero(days: number): Countdown {
  if (days < 0) return { value: String(-days), unit: `${plural(-days, 'día', 'días')} de atraso` };
  if (days === 0) return { value: 'Hoy', unit: '' };
  if (days < 100) return { value: String(days), unit: `${plural(days, 'día', 'días')} para vencer` };
  const months = Math.round(days / 30);
  return { value: String(months), unit: `${plural(months, 'mes', 'meses')} para vencer` };
}

/** Frase para la pantalla de detalle. */
export function dueText(days: number): string {
  if (days < 0) return `Venció hace ${-days} ${plural(-days, 'día', 'días')}`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days < 100) return `Faltan ${days} días`;
  return `Faltan unos ${Math.round(days / 30)} meses`;
}

export const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'urgent', label: 'Urgentes' },
  { id: 'upcoming', label: 'Próximos' },
  { id: 'later', label: 'Más adelante' },
];

export function matchesFilter(filter: Filter, days: number): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'urgent':
      return days <= URGENT_DAYS;
    case 'upcoming':
      return days > URGENT_DAYS && days <= SOON_DAYS;
    case 'later':
      return days > SOON_DAYS;
  }
}
