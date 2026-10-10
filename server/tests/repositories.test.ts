import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DuplicateEmailError } from '../src/errors';
import { InMemoryReminderRepo, InMemoryUserRepo } from '../src/repositories/memory';
import { ensureIndexes, MongoReminderRepo, MongoUserRepo } from '../src/repositories/mongo';
import type { ReminderRepo, UserRepo } from '../src/repositories/types';
import type { ReminderInput } from '../src/types';

/**
 * Tests de contrato: las MISMAS pruebas corren contra la versión en memoria (la que usan los otros
 * tests) y contra un MongoDB real (un servidor temporal que se levanta solo y se borra al terminar).
 * Si las dos pasan, la versión en memoria es una réplica fiel y los tests de la API son confiables.
 */

const newId = () => new mongoose.Types.ObjectId().toString();

const reminderInput = (overrides: Partial<ReminderInput> = {}): ReminderInput => ({
  title: 'Renovar libreta de conducir',
  category: 'licencia',
  dueDate: '2026-12-15',
  remindDaysBefore: [30, 7],
  ...overrides,
});

interface Repos {
  users: UserRepo;
  reminders: ReminderRepo;
}

let mongod: MongoMemoryServer;

// La primera vez descarga el binario de MongoDB (unos 100 MB), por eso el tiempo límite largo.
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('vencimientos_test'));
  await ensureIndexes();
}, 180_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await mongoose.connection.collection('users').deleteMany({});
  await mongoose.connection.collection('reminders').deleteMany({});
});

const implementations: Array<[string, () => Repos]> = [
  ['en memoria', () => ({ users: new InMemoryUserRepo(), reminders: new InMemoryReminderRepo() })],
  ['MongoDB real', () => ({ users: new MongoUserRepo(), reminders: new MongoReminderRepo() })],
];

describe.each(implementations)('repositorio de usuarios (%s)', (_name, build) => {
  it('crea un usuario y lo encuentra por email', async () => {
    const { users } = build();
    const created = await users.create({ email: 'ana@example.com', passwordHash: 'hash' });

    expect(created.id).toEqual(expect.any(String));
    const found = await users.findByEmail('ana@example.com');
    expect(found?.id).toBe(created.id);
    expect(found?.passwordHash).toBe('hash');
  });

  it('devuelve null si el email no existe', async () => {
    const { users } = build();
    expect(await users.findByEmail('nadie@example.com')).toBeNull();
  });

  it('rechaza un email repetido con DuplicateEmailError', async () => {
    const { users } = build();
    await users.create({ email: 'ana@example.com', passwordHash: 'hash' });

    await expect(users.create({ email: 'ana@example.com', passwordHash: 'otro' })).rejects.toBeInstanceOf(
      DuplicateEmailError,
    );
  });
});

describe.each(implementations)('repositorio de recordatorios (%s)', (_name, build) => {
  it('crea un recordatorio y lo devuelve con id, dueño y fechas', async () => {
    const { reminders } = build();
    const userId = newId();
    const created = await reminders.create(userId, reminderInput());

    expect(created.id).toEqual(expect.any(String));
    expect(created.userId).toBe(userId);
    expect(created.title).toBe('Renovar libreta de conducir');
    expect(created.remindDaysBefore).toEqual([30, 7]);
    expect(created.createdAt).toBeInstanceOf(Date);
  });

  it('lista solo los del usuario y ordenados por fecha de vencimiento', async () => {
    const { reminders } = build();
    const ana = newId();
    const beto = newId();
    await reminders.create(ana, reminderInput({ title: 'B', dueDate: '2027-03-01' }));
    await reminders.create(ana, reminderInput({ title: 'A', dueDate: '2026-11-01' }));
    await reminders.create(beto, reminderInput({ title: 'De Beto' }));

    const list = await reminders.listByUser(ana);
    expect(list.map((r) => r.title)).toEqual(['A', 'B']);
  });

  it('edita un recordatorio propio y el cambio queda guardado', async () => {
    const { reminders } = build();
    const userId = newId();
    const created = await reminders.create(userId, reminderInput());

    const updated = await reminders.update(userId, created.id, reminderInput({ title: 'Renovada', dueDate: '2031-12-15' }));
    expect(updated?.title).toBe('Renovada');
    expect(updated?.dueDate).toBe('2031-12-15');

    const [stored] = await reminders.listByUser(userId);
    expect(stored?.title).toBe('Renovada');
  });

  it('no deja editar el recordatorio de otro usuario', async () => {
    const { reminders } = build();
    const ana = newId();
    const created = await reminders.create(ana, reminderInput());

    const result = await reminders.update(newId(), created.id, reminderInput({ title: 'Hackeado' }));
    expect(result).toBeNull();

    const [stored] = await reminders.listByUser(ana);
    expect(stored?.title).toBe('Renovar libreta de conducir');
  });

  it('devuelve null al editar un id que no existe o que no es válido', async () => {
    const { reminders } = build();
    const userId = newId();

    expect(await reminders.update(userId, newId(), reminderInput())).toBeNull();
    expect(await reminders.update(userId, 'no-es-un-id', reminderInput())).toBeNull();
  });

  it('borra un recordatorio propio', async () => {
    const { reminders } = build();
    const userId = newId();
    const created = await reminders.create(userId, reminderInput());

    expect(await reminders.remove(userId, created.id)).toBe(true);
    expect(await reminders.listByUser(userId)).toEqual([]);
  });

  it('no deja borrar el recordatorio de otro usuario', async () => {
    const { reminders } = build();
    const ana = newId();
    const created = await reminders.create(ana, reminderInput());

    expect(await reminders.remove(newId(), created.id)).toBe(false);
    expect(await reminders.listByUser(ana)).toHaveLength(1);
  });

  it('devuelve false al borrar un id que no existe o que no es válido', async () => {
    const { reminders } = build();
    const userId = newId();

    expect(await reminders.remove(userId, newId())).toBe(false);
    expect(await reminders.remove(userId, 'no-es-un-id')).toBe(false);
  });

  it('no se deja engañar por un id de usuario inválido ni por operadores de MongoDB', async () => {
    const { reminders } = build();
    await reminders.create(newId(), reminderInput());

    expect(await reminders.listByUser('no-es-un-id')).toEqual([]);
    // Intento de inyección: { $ne: '' } coincidiría con todos los usuarios si el filtro no estuviera protegido.
    expect(await reminders.listByUser({ $ne: '' } as unknown as string)).toEqual([]);
  });
});
