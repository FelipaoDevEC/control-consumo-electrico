import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Si una petición llegó hasta aquí, ninguna ruta la atendió
export function rutaNoEncontrada(req, res, next) {
  next(
    new AppError({
      status: 404,
      codigo: ERROR_CODES.RUTA_NO_ENCONTRADA,
      mensaje: 'La ruta solicitada no existe.',
    })
  );
}