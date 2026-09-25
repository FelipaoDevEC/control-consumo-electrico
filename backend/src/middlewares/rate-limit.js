import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// 🏭 Fábrica de guardias "calma, uno a la vez"
// Ejemplo: crearLimitador({ minutos: 1, maximo: 120 })
export function crearLimitador({ minutos, maximo, omitir = () => false }) {
  return rateLimit({
    windowMs: minutos * 60 * 1000, // la ventana de tiempo, en milisegundos
    limit: maximo,                 // cuántos pedidos caben en esa ventana

    standardHeaders: true,  // etiquetas RateLimit-Limit, -Remaining, -Reset
    legacyHeaders: false,   // sin las etiquetas antiguas X-RateLimit-*

    skip: omitir,           // cuándo NO contar

    // 🛎️ En vez de responder él mismo, manda el reclamo a nuestro mostrador.
    // Así el 429 tiene el mismo formato que todos los errores (con ticket).
    handler(req, res, next) {
      next(
        new AppError({
          status: 429,
          codigo: ERROR_CODES.RATE_LIMIT_EXCEDIDO,
          mensaje: 'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        })
      );
    },
  });
}

// 🐢 Guardia general: 120 pedidos por minuto por cada IP.
// En las pruebas automáticas no cuenta (ahí haremos cientos de pedidos
// seguidos a propósito y no queremos que el guardia los frene).
export const limitadorGeneral = crearLimitador({
  minutos: 1,
  maximo: 120,
  omitir: () => env.esTest,
});