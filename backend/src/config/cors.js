import { env } from './env.js';

// 📋 Lista de invitados del backend
export const opcionesCors = {
  origin(origin, callback) {
    // Sin origen: no viene de una página web (Thunder Client, pruebas)
    if (!origin) {
      return callback(null, true);
    }

    // ✅ Nuestra página invitada: el frontend React
    if (origin === env.frontendUrl) {
      return callback(null, true);
    }

    // 🚫 Cualquier otra página: no la ponemos en la lista.
    // El navegador (la mamá) se encargará de bloquearla.
    return callback(null, false);
  },

  // Permite enviar cookies (las usaremos en el login, CP3)
  credentials: true,

  // Métodos que aceptamos
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],

  // Etiquetas que la página puede enviarnos
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Etiquetas nuestras que React SÍ podrá leer (¡el ticket!)
  exposedHeaders: ['X-Request-Id'],

  // La mamá recuerda el "toc toc" por 10 minutos
  maxAge: 600,
};