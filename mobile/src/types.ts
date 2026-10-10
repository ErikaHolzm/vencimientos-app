export type Category = 'licencia' | 'seguro' | 'vehiculo' | 'documento' | 'salud' | 'otro';

export interface ReminderInput {
  title: string;
  category: Category;
  /** AAAA-MM-DD */
  dueDate: string;
  /** Días antes del vencimiento en que se avisa. 0 = el mismo día. */
  remindDaysBefore: number[];
}

export interface Reminder extends ReminderInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
