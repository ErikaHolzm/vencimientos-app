import request from 'supertest';
import { buildApp, PASSWORD } from './helpers';

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
