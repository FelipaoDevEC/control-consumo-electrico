import { env } from '../config/env.js';

// Elige el "color" de la línea según cómo terminó el pedido
function nivelSegunStatus(status) {
  if (status >= 500) return 'ERROR';
  if (status >= 400) return 'WARN ';
  return 'INFO ';
}

// 📓 El portero anota una línea cuando cada pedido TERMINA
export function registrarPeticion(req, res, next) {
  // Durante las pruebas automáticas no llenamos la pantalla
  if (env.esTest) {
    return next();
  }

  const inicio = performance.now(); // ⏱️ arranca el cronómetro

  // 'finish' = "la respuesta ya salió de la cocina"
  res.on('finish', () => {
    const duracion = Math.round(performance.now() - inicio);

    // Quitamos lo que va después de "?" (puede tener datos sensibles)
    const ruta = req.originalUrl.split('?')[0];

    const nivel = nivelSegunStatus(res.statusCode);

    console.log(
      `[${nivel}] ${req.method} ${ruta} → ${res.statusCode} (${duracion} ms) id=${req.requestId}`
    );
  });

  next();
}