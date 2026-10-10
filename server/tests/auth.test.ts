import jwt from 'jsonwebtoken';
import request from 'supertest';
import { buildApp, PASSWORD, registerUser, testConfig, validReminder } from './helpers';

describe('POST /api/auth/register', () => {
  it('crea el usuario y devuelve un token (sin exponer el hash)', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/auth/register').send({ email: 'Ana@Example.com', password: PASSWORD });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe('ana@example.com'); // se normaliza a minúsculas
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rechaza un email repetido con 409', async () => {
    const app = buildApp();
    await request(app).post('/api/auth/register').send({ email: 'ana@example.com', password: PASSWORD });
    const res = await request(app).post('/api/auth/register').send({ email: 'ANA@example.com', password: PASSWORD });

    expect(res.status).toBe(409);
  });

  it('rechaza contraseñas cortas', async () => {
    const res = await request(buildApp()).post('/api/auth/register').send({ email: 'ana@example.com', password: 'corta' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Datos inválidos');
  });

  it('rechaza un email inválido', async () => {
    const res = await request(buildApp()).post('/api/auth/register').send({ email: 'no-es-un-email', password: PASSWORD });

    expect(res.status).toBe(400);
  });

  it('rechaza campos que no esperaba', async () => {
    const res = await request(buildApp())
      .post('/api/auth/register')
      .send({ email: 'ana@example.com', password: PASSWORD, isAdmin: true });

    expect(res.status).toBe(400);
  });

  it('responde 400 ante un JSON roto', async () => {
    const res = await request(buildApp())
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('devuelve un token con credenciales correctas', async () => {
    const app = buildApp();
    await request(app).post('/api/auth/register').send({ email: 'ana@example.com', password: PASSWORD });
    const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('da el mismo error para contraseña incorrecta y para usuario inexistente', async () => {
    const app = buildApp();
    await request(app).post('/api/auth/register').send({ email: 'ana@example.com', password: PASSWORD });

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'otra-contrasena-x' });
    const unknownUser = await request(app).post('/api/auth/login').send({ email: 'nadie@example.com', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });
});

describe('límite de intentos', () => {
  it('bloquea con 429 después de demasiados intentos de login', async () => {
    const app = buildApp({ rateLimitEnabled: true });
    let last = 0;
    for (let i = 0; i < 25; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: 'x' });
      last = res.status;
    }

    expect(last).toBe(429);
  });
});

describe('rutas generales', () => {
  it('GET /health responde ok', async () => {
    const res = await request(buildApp()).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('una ruta inexistente responde 404 en JSON', async () => {
    const res = await request(buildApp()).get('/api/nada');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Ruta no encontrada');
  });
});

describe('POST /api/auth/logout', () => {
  it('invalida el token: después de cerrar sesión ya no sirve', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    expect((await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`)).status).toBe(200);

    const out = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(out.status).toBe(204);

    const after = await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  it('cerrar sesión no afecta a los tokens nuevos (volver a entrar funciona)', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

    const login = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: PASSWORD });
    const res = await request(app).get('/api/reminders').set('Authorization', `Bearer ${login.body.token as string}`);
    expect(res.status).toBe(200);
  });

  it('exige estar autenticado', async () => {
    expect((await request(buildApp()).post('/api/auth/logout')).status).toBe(401);
  });
});

describe('POST /api/auth/change-password', () => {
  const NEW_PASSWORD = 'otra-contrasena-nueva-456';

  it('cambia la contraseña, invalida el token viejo y devuelve uno nuevo que sirve', async () => {
    const app = buildApp();
    const oldToken = await registerUser(app, 'ana@example.com');

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${oldToken}`)
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(200);

    const withOld = await request(app).get('/api/reminders').set('Authorization', `Bearer ${oldToken}`);
    expect(withOld.status).toBe(401);
    const withNew = await request(app).get('/api/reminders').set('Authorization', `Bearer ${res.body.token as string}`);
    expect(withNew.status).toBe(200);

    const oldLogin = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: PASSWORD });
    const newLogin = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: NEW_PASSWORD });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('rechaza con 403 si la contraseña actual es incorrecta (y no cambia nada)', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'no-es-la-contrasena', newPassword: NEW_PASSWORD });
    expect(res.status).toBe(403);

    // El token sigue valiendo y la contraseña vieja también.
    expect((await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: PASSWORD })).status).toBe(200);
  });

  it('valida la nueva contraseña (largo y que sea distinta)', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    const change = (body: object) =>
      request(app).post('/api/auth/change-password').set('Authorization', `Bearer ${token}`).send(body);

    expect((await change({ currentPassword: PASSWORD, newPassword: 'corta' })).status).toBe(400);
    expect((await change({ currentPassword: PASSWORD, newPassword: PASSWORD })).status).toBe(400);
    expect((await change({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD, extra: 1 })).status).toBe(400);
  });

  it('exige estar autenticado', async () => {
    const res = await request(buildApp())
      .post('/api/auth/change-password')
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/auth/account', () => {
  it('borra la cuenta y sus recordatorios; no se puede volver a entrar ni usar el token', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    await request(app).post('/api/reminders').set('Authorization', `Bearer ${token}`).send(validReminder);

    const res = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${token}`).send({ password: PASSWORD });
    expect(res.status).toBe(204);

    expect((await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`)).status).toBe(401);
    expect((await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: PASSWORD })).status).toBe(401);

    // El email queda libre: se puede registrar de nuevo y arranca sin recordatorios.
    const again = await registerUser(app, 'ana@example.com');
    const list = await request(app).get('/api/reminders').set('Authorization', `Bearer ${again}`);
    expect(list.body.reminders).toEqual([]);
  });

  it('con contraseña incorrecta responde 403 y no borra nada', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');
    await request(app).post('/api/reminders').set('Authorization', `Bearer ${token}`).send(validReminder);

    const res = await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${token}`).send({ password: 'incorrecta' });
    expect(res.status).toBe(403);

    const list = await request(app).get('/api/reminders').set('Authorization', `Bearer ${token}`);
    expect(list.body.reminders).toHaveLength(1);
  });

  it('no toca los datos de otros usuarios', async () => {
    const app = buildApp();
    const ana = await registerUser(app, 'ana@example.com');
    const beto = await registerUser(app, 'beto@example.com');
    await request(app).post('/api/reminders').set('Authorization', `Bearer ${beto}`).send(validReminder);

    await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${ana}`).send({ password: PASSWORD });

    const list = await request(app).get('/api/reminders').set('Authorization', `Bearer ${beto}`);
    expect(list.body.reminders).toHaveLength(1);
  });

  it('exige la contraseña en el cuerpo y estar autenticado', async () => {
    const app = buildApp();
    const token = await registerUser(app, 'ana@example.com');

    expect((await request(app).delete('/api/auth/account').set('Authorization', `Bearer ${token}`).send({})).status).toBe(400);
    expect((await request(app).delete('/api/auth/account').send({ password: PASSWORD })).status).toBe(401);
  });
});

describe('tokens', () => {
  it('rechaza un token firmado correctamente pero sin versión (emitido antes de esta mejora)', async () => {
    const app = buildApp();
    await registerUser(app, 'ana@example.com');
    const user = await request(app).post('/api/auth/login').send({ email: 'ana@example.com', password: PASSWORD });
    const id = user.body.user.id as string;

    const legacy = jwt.sign({}, testConfig.jwtSecret, { algorithm: 'HS256', subject: id, expiresIn: 3600 });
    const res = await request(app).get('/api/reminders').set('Authorization', `Bearer ${legacy}`);
    expect(res.status).toBe(401);
  });
});
