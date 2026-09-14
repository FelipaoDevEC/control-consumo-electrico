import pg from 'pg';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(
  __dirname,
  '..',
  'database',
  'migrations'
);

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function mostrarEstadoMigraciones() {
  try {
    await client.connect();

    console.log('✅ Conectado a PostgreSQL.');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
    console.log('');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(20) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const archivos = await readdir(migrationsDir);

    const migraciones = archivos
      .filter((archivo) => /^\d{3}_.+\.sql$/.test(archivo))
      .sort();

    if (migraciones.length === 0) {
      console.log('ℹ️ No se encontraron migraciones.');
      return;
    }

    for (const archivo of migraciones) {
      const version = archivo.slice(0, 3);

      const resultado = await client.query(
        `
          SELECT version
          FROM schema_migrations
          WHERE version = $1;
        `,
        [version]
      );

      const aplicada = resultado.rowCount > 0;

      if (aplicada) {
        console.log(`✅ ${archivo} — APLICADA`);
      } else {
        console.log(`⏳ ${archivo} — PENDIENTE`);
      }
    }
  } catch (error) {
    console.error('❌ Error consultando estado de migraciones.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await mostrarEstadoMigraciones();