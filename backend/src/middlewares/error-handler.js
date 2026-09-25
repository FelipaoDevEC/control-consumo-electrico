import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Mostrador de reclamos: TODOS los errores terminan aquí.
// Express lo reconoce porque recibe 4 cosas: (error, req, res, next)
export function manejarErrores(error, req, res, next) {
  // Si ya empezamos a responder, no podemos cambiar la respuesta
  if (res.headersSent) {
    return next(error);
  }

  // 🟡 Error ESPERADO: le explicamos al cliente qué pasó
  if (error instanceof AppError) {
    const respuesta = {
      error: {
        codigo: error.codigo,
        mensaje: error.message,
      },
    };

    if (error.detalles !== undefined) {
      respuesta.error.detalles = error.detalles;
    }

    respuesta.error.requestId = req.requestId;

    return res.status(error.status).json(respuesta);
  }

  // 🔴 Error INESPERADO: detalles en la terminal (con ticket), disculpa al cliente
  console.error(`💥 Error inesperado (id=${req.requestId}):`, error);

  return res.status(500).json({
    error: {
      codigo: ERROR_CODES.ERROR_INTERNO,
      mensaje: 'Ocurrió un error inesperado.',
      requestId: req.requestId,
    },
  });
}