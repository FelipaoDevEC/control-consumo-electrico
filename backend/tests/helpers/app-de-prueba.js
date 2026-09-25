import express from 'express';
import { asignarRequestId } from '../../src/middlewares/request-id.js';
import { rutaNoEncontrada } from '../../src/middlewares/not-found.js';
import { manejarErrores } from '../../src/middlewares/error-handler.js';

// 🧪 Mini restaurante de laboratorio.
// Trae lo mínimo: ticket, lector JSON y mostrador de reclamos.
// En el medio, cada prueba pone SOLO la pieza que quiere estudiar.
export function crearAppDePrueba(prepararRutas) {
  const app = express();

  app.use(asignarRequestId);
  app.use(express.json());

  prepararRutas(app); // 🌱 aquí va la pieza a estudiar

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);

  return app;
}