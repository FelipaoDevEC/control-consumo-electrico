import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validar } from '../../src/middlewares/validar.js';
import { idSchema } from '../../src/validators/common.validators.js';
import { crearAppDePrueba } from '../helpers/app-de-prueba.js';

const lecturaSchema = z.object(
  {
    fechaLectura: z
      .string({ error: 'fechaLectura debe ser un texto.' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        error: 'fechaLectura debe tener el formato AAAA-MM-DD.',
      }),
    valorLectura: z
      .number({ error: 'valorLectura debe ser un número.' })
      .int({ error: 'valorLectura debe ser un número entero.' }),
  },
  { error: 'El cuerpo debe ser un objeto JSON.' }
);

// 🧪 Mini restaurante con el inspector en dos ventanillas
const app = crearAppDePrueba((app) => {
  app.post('/lectura', validar({ body: lecturaSchema }), (req, res) => {
    res.json(req.validated.body);
  });

  app.get('/cosas/:id', validar({ params: z.object({ id: idSchema }) }), (req, res) => {
    res.json(req.validated.params);
  });
});

describe('🔍 Inspector de body', () => {
  it('aprueba un formulario correcto y descarta los campos extra', async () => {
    const respuesta = await request(app).post('/lectura').send({
      fechaLectura: '2026-08-30',
      valorLectura: 12555,
      rol: 'ADMIN', // 😈 intento de colarse
    });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      fechaLectura: '2026-08-30',
      valorLectura: 12555,
    });
  });

  it('rechaza un decimal con 422 y dice qué campo está mal', async () => {
    const respuesta = await request(app).post('/lectura').send({
      fechaLectura: '2026-08-30',
      valorLectura: 125.5,
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.codigo).toBe('VALIDACION_DATOS_INVALIDOS');
    expect(respuesta.body.error.detalles.campos).toEqual([
      { campo: 'valorLectura', mensaje: 'valorLectura debe ser un número entero.' },
    ]);
  });

  it('devuelve TODOS los errores de una vez', async () => {
    const respuesta = await request(app).post('/lectura').send({
      fechaLectura: '30/08/2026',
      valorLectura: 'hola',
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.detalles.campos).toHaveLength(2);
  });

  it('rechaza un pedido sin body', async () => {
    const respuesta = await request(app).post('/lectura');

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error.detalles.campos[0].campo).toBe('body');
  });
});

describe('🔍 Inspector de params', () => {
  it('convierte el id de texto a número', async () => {
    const respuesta = await request(app).get('/cosas/15');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ id: 15 });
  });

  it('rechaza un id que no es número', async () => {
    const respuesta = await request(app).get('/cosas/abc');

    expect(respuesta.status).toBe(422);
  });
});