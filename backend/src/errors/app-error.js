// Ficha de reclamo para errores que SÍ esperábamos
// Ejemplo: "ya existe una lectura para esa fecha"
export class AppError extends Error {
  constructor({ status, codigo, mensaje, detalles }) {
    super(mensaje);

    this.name = 'AppError';
    this.status = status;     // número HTTP: 404, 409, 422...
    this.codigo = codigo;     // etiqueta para la máquina
    this.detalles = detalles; // información extra (opcional)
  }
}