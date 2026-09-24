import pg from 'pg';
import { env } from '../config/env.js';

const { Pool, types } = pg;

// ─────────────────────────────────────────────
// 1. Fechas de calendario (DATE) → texto tal cual
//    "Un cumpleaños no tiene hora": 2026-08-30
// ─────────────────────────────────────────────
const TIPO_DATE = 1082;

types.setTypeParser(TIPO_DATE, (texto) => texto);

// ─────────────────────────────────────────────
// 2. Números enteros grandes (BIGINT) → número real
//    Para que 9 < 10 funcione bien
// ─────────────────────────────────────────────
const TIPO_BIGINT = 20;

types.setTypeParser(TIPO_BIGINT, (texto) => {
  const numero = Number(texto);

  if (!Number.isSafeInteger(numero)) {
    throw new Error(
      `El número ${texto} es demasiado grande para JavaScript`
    );
  }

  return numero;
});

// ─────────────────────────────────────────────
// 3. La fila de carritos (un solo pool para toda la app)
// ─────────────────────────────────────────────
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,

  max: 10,                        // máximo 10 carritos
  idleTimeoutMillis: 30_000,      // un carrito sin uso 30 s se guarda
  connectionTimeoutMillis: 5_000, // si en 5 s no hay carrito, error
});

// Si un carrito que estaba descansando se rompe, avisamos
// (sin esto, el servidor completo podría caerse)
pool.on('error', (error) => {
  console.error('⚠️ Una conexión inactiva de PostgreSQL falló:', error.message);
});

// ─────────────────────────────────────────────
// 4. Revisar que la bodega abre
// ─────────────────────────────────────────────
export async function verificarConexionBD() {
  const resultado = await pool.query(`
    SELECT
      current_database() AS base,
      current_user       AS usuario
  `);

  return resultado.rows[0];
}