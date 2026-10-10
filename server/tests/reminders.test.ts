import jwt from 'jsonwebtoken';
import request from 'supertest';
import { buildApp, isoDaysFromNow, registerUser, testConfig, validReminder } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('autenticación de /api/reminders', () => {
  it('sin token responde 401', async () => {
    const res = await request(buildApp()).get('/api/reminders');
    expect(res.status).toBe(401);
  });

  it('con un token basura responde 401', async () => {
    const res = await request(buildApp()).get('/api/reminders').set(auth('esto.no.es.un.jwt'));
    expect(res.status).toBe(401);
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const forged = jwt.sign({}, 'otro-secreto-distinto-de-32-caracteres-xx', { algorithm: 'HS256', subject: 'alguien' });
    const res = await request(buildApp()).get('/api/reminders').set(auth(forged));
    expect(res.status).toBe(401);
  });

  it('rechaza un token vencido', async () => {
    const expired = jwt.sign({}, testConfig.jwtSecret, { algorithm: 'HS256', subject: 'alguien', expiresIn: -10 });
    const res = await request(buildApp()).get('/api/reminders').set(auth(expired));
    expect(res.status).toBe(401);
  });

  it('rechaza un token sin firma (alg none)', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ sub: 'alguien' })).toString('base64url');
    const res = await request(buildApp()).get('/api/reminders').set(auth(`${header}.${body}.`));
    expect(res.status).toBe(401);
  });
});

describe('CRUD de recordatorios', () => {
  it('crea, lista, edita y borra', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');

    // Crear: los avisos se ordenan de mayor a menor
    const created = await request(app).post('/api/reminders').set(auth(token)).send(validReminder);
    expect(created.status).toBe(201);
    expect(created.body.reminder.remindDaysBefore).toEqual([30, 7, 1]);
    expect(created.body.reminder).not.toHaveProperty('userId');
    const id = created.body.reminder.id as string;

    // Listar
    const list = await request(app).get('/api/reminders').set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body.reminders).toHaveLength(1);

    // Editar
    const updated = await request(app)
      .put(`/api/reminders/${id}`)
      .set(auth(token))
      .send({ ...validReminder, title: 'Libreta renovada', dueDate: isoDaysFromNow(365 * 5) });
    expect(updated.status).toBe(200);
    expect(updated.body.reminder.title).toBe('Libreta renovada');

    // Borrar
    const removed = await request(app).delete(`/api/reminders/${id}`).set(auth(token));
    expect(removed.status).toBe(204);
    const after = await request(app).get('/api/reminders').set(auth(token));
    expect(after.body.reminders).toHaveLength(0);
  });

  it('devuelve la lista ordenada por fecha de vencimiento', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    await request(app).post('/api/reminders').set(auth(token)).send({ ...validReminder, title: 'B', dueDate: isoDaysFromNow(200) });
    await request(app).post('/api/reminders').set(auth(token)).send({ ...validReminder, title: 'A', dueDate: isoDaysFromNow(20) });

    const list = await request(app).get('/api/reminders').set(auth(token));
    expect(list.body.reminders.map((r: { title: string }) => r.title)).toEqual(['A', 'B']);
  });
});

describe('aislamiento entre usuarios', () => {
  it('un usuario no ve, edita ni borra los recordatorios de otro', async () => {
    const app = buildApp();
    const ana = await registerUser(app, 'ana@example.com');
    const beto = await registerUser(app, 'beto@example.com');

    const created = await request(app).post('/api/reminders').set(auth(ana)).send(validReminder);
    const id = created.body.reminder.id as string;

    const betoList = await request(app).get('/api/reminders').set(auth(beto));
    expect(betoList.body.reminders).toHaveLength(0);

    const betoEdit = await request(app).put(`/api/reminders/${id}`).set(auth(beto)).send({ ...validReminder, title: 'Hackeado' });
    expect(betoEdit.status).toBe(404);

    const betoDelete = await request(app).delete(`/api/reminders/${id}`).set(auth(beto));
    expect(betoDelete.status).toBe(404);

    // El de Ana sigue intacto
    const anaList = await request(app).get('/api/reminders').set(auth(ana));
    expect(anaList.body.reminders[0].title).toBe(validReminder.title);
  });

  it('ignora un userId enviado en el cuerpo (se rechaza por campo no permitido)', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app).post('/api/reminders').set(auth(token)).send({ ...validReminder, userId: 'otro' });
    expect(res.status).toBe(400);
  });
});

describe('validación de recordatorios', () => {
  const cases: Array<[string, Record<string, unknown>]> = [
    ['título vacío', { title: '   ' }],
    ['título demasiado largo', { title: 'x'.repeat(121) }],
    ['categoría desconocida', { category: 'inventada' }],
    ['fecha con formato incorrecto', { dueDate: '15/12/2026' }],
    ['fecha que no existe', { dueDate: '2026-02-31' }],
    ['fecha de hace más de un año', { dueDate: isoDaysFromNow(-400) }],
    ['fecha del año 1900', { dueDate: '1900-01-01' }],
    ['fecha demasiado lejana', { dueDate: '9999-12-31' }],
    ['aviso negativo', { remindDaysBefore: [-1] }],
    ['aviso que no es entero', { remindDaysBefore: [1.5] }],
    ['demasiados avisos', { remindDaysBefore: [1, 2, 3, 4, 5, 6, 7] }],
  ];

  it.each(cases)('rechaza: %s', async (_name, patch) => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app).post('/api/reminders').set(auth(token)).send({ ...validReminder, ...patch });
    expect(res.status).toBe(400);
  });

  it('acepta algo que venció hace unos meses (se muestra como vencido)', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app)
      .post('/api/reminders')
      .set(auth(token))
      .send({ ...validReminder, dueDate: isoDaysFromNow(-100) });
    expect(res.status).toBe(201);
  });

  it('acepta justo el límite de un año hacia atrás', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app)
      .post('/api/reminders')
      .set(auth(token))
      .send({ ...validReminder, dueDate: isoDaysFromNow(-365) });
    expect(res.status).toBe(201);
  });

  it('explica el rango permitido cuando la fecha se pasa del límite', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app)
      .post('/api/reminders')
      .set(auth(token))
      .send({ ...validReminder, dueDate: '2023-05-10' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.error.details)).toContain('La fecha debe estar entre');
  });

  it('elimina avisos repetidos', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app)
      .post('/api/reminders')
      .set(auth(token))
      .send({ ...validReminder, remindDaysBefore: [7, 7, 1] });
    expect(res.body.reminder.remindDaysBefore).toEqual([7, 1]);
  });

  it('un id inexistente responde 404', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const res = await request(app).delete('/api/reminders/no-existe').set(auth(token));
    expect(res.status).toBe(404);
  });
});
