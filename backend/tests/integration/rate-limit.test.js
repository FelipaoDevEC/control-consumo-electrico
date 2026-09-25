import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { crearLimitador } from '../../src/middlewares/rate-limit.js';
import { crearAppDePrueba } from '../helpers/app-de-prueba.js';

// Un mini restaurante NUEVO en cada prueba (contador desde cero)
function appConLimiteDeDos() {
  return crearAppDePrueba((app) => {
    app.use(crearLimitador({ minutos: 1, maximo: 2 }));
    app.get('/ping', (req, res) => res.json({ pong: true }));
  });
}

describe('🐢 Fábrica de limitadores', () => {
  it('deja pasar 2 pedidos y frena el 3.º con 429', async () => {
    const app = appConLimiteDeDos();

    const primero = await request(app).get('/ping');
    const segundo = await request(app).get('/ping');
    const tercero = await request(app).get('/ping');

    expect(primero.status).toBe(200);
    expect(segundo.status).toBe(200);
    expect(tercero.status).toBe(429);
    expect(tercero.body.error.codigo).toBe('RATE_LIMIT_EXCEDIDO');
    expect(tercero.body.error.requestId).toBeDefined();
  });

  it('informa cuántos pedidos quedan (el marcador de vidas)', async () => {
    const app = appConLimiteDeDos();

    const respuesta = await request(app).get('/ping');

    expect(respuesta.headers['ratelimit-limit']).toBe('2');
    expect(respuesta.headers['ratelimit-remaining']).toBe('1');
  });
});