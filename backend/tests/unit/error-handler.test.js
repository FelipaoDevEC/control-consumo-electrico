import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/errors/app-error.js';
import { crearAppDePrueba } from '../helpers/app-de-prueba.js';

// 🧪 Mini restaurante con rutas que fallan a propósito
const app = crearAppDePrueba((app) => {
  app.get('/esperado', () => {
    throw new AppError({
      status: 409,
      codigo: 'DEMO_CONFLICTO',
      mensaje: 'Error esperado de prueba.',
      detalles: { motivo: 'demo' },
    });
  });

  app.get('/inesperado', () => {
    throw new Error('Secreto de la cocina: tabla usuarios, línea 42');
  });

  app.get('/async', async () => {
    await Promise.resolve();
    throw new Error('Falló dentro de un async');
  });
});

describe('🛎️ Mostrador de reclamos', () => {
  // 🤫 Silenciamos el console.error del mostrador para que la
  // pantalla del robot no se llene de 💥. Y al final lo restauramos.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('error ESPERADO → su status, código, detalles y ticket', async () => {
    const respuesta = await request(app).get('/esperado');

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toEqual({
      codigo: 'DEMO_CONFLICTO',
      mensaje: 'Error esperado de prueba.',
      detalles: { motivo: 'demo' },
      requestId: respuesta.headers['x-request-id'],
    });
  });

  it('error INESPERADO → 500 genérico, sin revelar secretos', async () => {
    const respuesta = await request(app).get('/inesperado');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body.error.codigo).toBe('ERROR_INTERNO');
    expect(respuesta.body.error.mensaje).toBe('Ocurrió un error inesperado.');

    // 🕵️ El secreto NO debe aparecer en ninguna parte de la respuesta
    expect(JSON.stringify(respuesta.body)).not.toContain('Secreto');

    // ...pero SÍ se anotó en la terminal para el programador
    expect(console.error).toHaveBeenCalled();
  });

  it('error dentro de un async también llega al mostrador', async () => {
    const respuesta = await request(app).get('/async');

    expect(respuesta.status).toBe(500);
    expect(respuesta.body.error.codigo).toBe('ERROR_INTERNO');
  });
});