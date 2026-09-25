import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

// Las 3 partes del pedido que podemos revisar
const UBICACIONES = ['params', 'query', 'body'];

// 🔍 Fábrica de inspectores.
// Uso: validar({ body: miEsquema }) o validar({ params: otroEsquema })
export function validar(esquemas) {
  return (req, res, next) => {
    const validado = {}; // aquí guardamos lo que pasó la inspección
    const campos = [];   // aquí anotamos TODAS las casillas malas

    for (const ubicacion of UBICACIONES) {
      const esquema = esquemas[ubicacion];

      // Si no nos pidieron revisar esta parte, la saltamos
      if (!esquema) continue;

      // safeParse = "revisa, pero no explotes: dime si pasó o no"
      const resultado = esquema.safeParse(req[ubicacion]);

      if (resultado.success) {
        validado[ubicacion] = resultado.data;
      } else {
        for (const problema of resultado.error.issues) {
          campos.push({
            // "valorLectura", o la parte entera si el problema es general
            campo:
              problema.path.length > 0 ? problema.path.join('.') : ubicacion,
            mensaje: problema.message,
          });
        }
      }
    }

    // ❌ Hubo casillas malas: devolvemos el formulario marcado
    if (campos.length > 0) {
      return next(
        new AppError({
          status: 422,
          codigo: ERROR_CODES.VALIDACION_DATOS_INVALIDOS,
          mensaje: 'Algunos datos no son válidos.',
          detalles: { campos },
        })
      );
    }

    // ✅ Todo bien: sello de aprobado 📮
    req.validated = validado;
    next();
  };
}