import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// 🔎 Traductor: convierte los errores del lector de JSON
// en errores ESPERADOS (culpa del cliente, no de la cocina)
function traducirErrorDelBody(error) {
  // 📝 La comanda no se puede leer
  if (error.type === 'entity.parse.failed') {
    return new AppError({
      status: 400,
      codigo: ERROR_CODES.JSON_INVALIDO,
      mensaje: 'El cuerpo de la petición no es un JSON válido.',
    });
  }

  // 📦 La comanda es demasiado grande
  if (error.type === 'entity.too.large') {
    return new AppError({
      status: 413,
      codigo: ERROR_CODES.SECURITY_BODY_DEMASIADO_GRANDE,
      mensaje: 'El cuerpo de la petición es demasiado grande.',
    });
  }

  // Cualquier otro error sigue igual
  return error;
}

// Mostrador de reclamos: TODOS los errores terminan aquí.
// Express lo reconoce porque recibe 4 cosas: (error, req, res, next)
export function manejarErrores(errorOriginal, req, res, next) {
  // Si ya empezamos a responder, no podemos cambiar la respuesta
  if (res.headersSent) {
    return next(errorOriginal);
  }

  const error = traducirErrorDelBody(errorOriginal);

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