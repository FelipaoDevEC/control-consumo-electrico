import dotenv from 'dotenv';

// ─────────────────────────────────────────────
// 1. ¿En qué modo estamos?
//    Si nadie dice nada, estamos programando.
// ─────────────────────────────────────────────
const MODOS_PERMITIDOS = ['development', 'test', 'production'];

const nodeEnv = process.env.NODE_ENV ?? 'development';

if (!MODOS_PERMITIDOS.includes(nodeEnv)) {
  throw new Error(
    `NODE_ENV inválido: "${nodeEnv}". Usa: ${MODOS_PERMITIDOS.join(', ')}`
  );
}

// ─────────────────────────────────────────────
// 2. Abrir la libreta correcta
// ─────────────────────────────────────────────
const archivoEnv = nodeEnv === 'test' ? '.env.test' : '.env';

dotenv.config({ path: archivoEnv, quiet: true });

// ─────────────────────────────────────────────
// 3. Ayudantes del portero
// ─────────────────────────────────────────────

// Revisa que un dato exista y no esté vacío
function requerirTexto(nombre) {
  const valor = process.env[nombre];

  if (!valor || valor.trim() === '') {
    throw new Error(
      `Falta la variable obligatoria ${nombre} en ${archivoEnv}`
    );
  }

  return valor.trim();
}

// Revisa que un puerto sea un número entero entre 1 y 65535
function leerPuerto(nombre, porDefecto) {
  const texto = process.env[nombre] ?? String(porDefecto);
  const numero = Number(texto);

  if (!Number.isInteger(numero) || numero < 1 || numero > 65535) {
    throw new Error(
      `${nombre} debe ser un puerto válido (1-65535). Recibido: "${texto}"`
    );
  }

  return numero;
}

// Revisa que un texto sea una dirección web válida
function leerUrl(nombre) {
  const valor = requerirTexto(nombre);

  try {
    new URL(valor);
  } catch {
    throw new Error(`${nombre} no es una URL válida. Recibido: "${valor}"`);
  }

  return valor;
}

// Revisa que la zona horaria exista de verdad
function leerZonaHoraria(nombre, porDefecto) {
  const valor = process.env[nombre] ?? porDefecto;

  try {
    new Intl.DateTimeFormat('es', { timeZone: valor });
  } catch {
    throw new Error(`${nombre} no es una zona horaria válida: "${valor}"`);
  }

  return valor;
}

// ─────────────────────────────────────────────
// 4. Armar la configuración revisada
// ─────────────────────────────────────────────
const configuracion = {
  nodeEnv,
  esTest: nodeEnv === 'test',
  port: leerPuerto('PORT', 3000),

  db: {
    host: requerirTexto('DB_HOST'),
    port: leerPuerto('DB_PORT', 5432),
    name: requerirTexto('DB_NAME'),
    user: requerirTexto('DB_USER'),
    password: requerirTexto('DB_PASSWORD'),
  },

  frontendUrl: leerUrl('FRONTEND_URL'),
  appTimezone: leerZonaHoraria('APP_TIMEZONE', 'America/Guayaquil'),
};

// ─────────────────────────────────────────────
// 5. Protección: las pruebas NUNCA tocan la base real
// ─────────────────────────────────────────────
if (configuracion.esTest && !configuracion.db.name.endsWith('_test')) {
  throw new Error(
    `Modo test con base "${configuracion.db.name}". ` +
      'Por seguridad, la base de pruebas debe terminar en "_test".'
  );
}

// ─────────────────────────────────────────────
// 6. Candado: nadie puede cambiar la configuración después
// ─────────────────────────────────────────────
export const env = Object.freeze({
  ...configuracion,
  db: Object.freeze(configuracion.db),
});