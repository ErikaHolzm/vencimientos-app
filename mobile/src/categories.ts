import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { Category } from './types';

export type IconName = ComponentProps<typeof Feather>['name'];

export const CATEGORIES: Array<{ id: Category; label: string; icon: IconName }> = [
  { id: 'licencia', label: 'Licencia', icon: 'credit-card' },
  { id: 'seguro', label: 'Seguro', icon: 'shield' },
  { id: 'vehiculo', label: 'Vehículo', icon: 'truck' },
  { id: 'documento', label: 'Documento', icon: 'file-text' },
  { id: 'salud', label: 'Salud', icon: 'activity' },
  { id: 'otro', label: 'Otro', icon: 'bell' },
];

export function categoryInfo(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

/** Opciones de "avisarme antes". 0 = el mismo día del vencimiento. */
export const REMIND_OPTIONS: Array<{ days: number; label: string }> = [
  { days: 30, label: '30 días' },
  { days: 15, label: '15 días' },
  { days: 7, label: '7 días' },
  { days: 1, label: '1 día' },
  { days: 0, label: 'El mismo día' },
];

export function remindLabel(days: number): string {
  if (days === 0) return 'El mismo día';
  return `${days} ${days === 1 ? 'día' : 'días'} antes`;
}
