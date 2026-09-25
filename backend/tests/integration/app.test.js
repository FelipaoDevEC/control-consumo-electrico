import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { env } from '../../src/config/env.js';

// Forma de un ticket UUID: 8-4-4-4-12 caracteres
const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('🩺 Health', () => {
  it('GET /api/health responde 200 con status ok', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ status: 'ok' });
  });
});

describe('🎫 Request ID', () => {
  it('cada respuesta trae un X-Request-Id con formato UUID', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.headers['x-request-id']).toMatch(FORMATO_UUID);
  });

  it('dos pedidos reciben tickets distintos', async () => {
    const primero = await request(app).get('/api/health');
    const segundo = await request(app).get('/api/health');

    expect(primero.headers['x-request-id']).not.toBe(
      segundo.headers['x-request-id']
    );
  });
});

describe('🤷 Rutas inexistentes', () => {
  it('GET /api/no-existe responde 404 con nuestro formato y el mismo ticket', async () => {
    const respuesta = await request(app).get('/api/no-existe');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
    expect(respuesta.body.error.requestId).toBe(
      respuesta.headers['x-request-id']
    );
  });

  it('POST /api/health responde 404 (el método también cuenta)', async () => {
    const respuesta = await request(app).post('/api/health');

    expect(respuesta.status).toBe(404);
  });
});

describe('🪖 Helmet', () => {
  it('agrega headers de seguridad y oculta X-Powered-By', async () => {
    const respuesta = await request(app).get('/api/health');

    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    expect(respuesta.headers['x-powered-by']).toBeUndefined();
  });
});

describe('🚪 CORS', () => {
  it('pone en la lista al frontend invitado', async () => {
    const respuesta = await request(app)
      .get('/api/health')
      .set('Origin', env.frontendUrl);

    expect(respuesta.headers['access-control-allow-origin']).toBe(
      env.frontendUrl
    );
    expect(respuesta.headers['access-control-expose-headers']).toContain(
      'X-Request-Id'
    );
  });

  it('NO pone en la lista a una página desconocida', async () => {
    const respuesta = await request(app)
      .get('/api/health')
      .set('Origin', 'http://pagina-mala.com');

    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde el "toc toc" (preflight) con los métodos permitidos', async () => {
    const respuesta = await request(app)
      .options('/api/health')
      .set('Origin', env.frontendUrl)
      .set('Access-Control-Request-Method', 'POST');

    expect(respuesta.status).toBe(204);
    expect(respuesta.headers['access-control-allow-methods']).toContain('POST');
  });
});

describe('📏 Body', () => {
  it('JSON roto → 400 JSON_INVALIDO', async () => {
    const respuesta = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"valorLectura": 12555,');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('JSON_INVALIDO');
  });

  it('body de 200 KB → 413 SECURITY_BODY_DEMASIADO_GRANDE', async () => {
    const respuesta = await request(app)
      .post('/api/health')
      .send({ relleno: 'a'.repeat(200_000) });

    expect(respuesta.status).toBe(413);
    expect(respuesta.body.error.codigo).toBe('SECURITY_BODY_DEMASIADO_GRANDE');
  });
});

describe('🐢 Rate limit general', () => {
  it('está apagado en modo test (125 pedidos seguidos pasan)', async () => {
    for (let i = 0; i < 125; i++) {
      const respuesta = await request(app).get('/api/health');
      expect(respuesta.status).toBe(200);
    }
  });
});