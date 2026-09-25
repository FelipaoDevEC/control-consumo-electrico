import { randomUUID } from 'node:crypto';

// 🎫 Le da a cada pedido un número de ticket único
export function asignarRequestId(req, res, next) {
  const requestId = randomUUID();

  // Para que el resto del backend lo conozca
  req.requestId = requestId;

  // Para que el cliente lo reciba de vuelta
  res.setHeader('X-Request-Id', requestId);

  next();
}