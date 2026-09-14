import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
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

async function ejecutarMigraciones() {
  try {
    await client.connect();

    console.log('✅ Conectado a PostgreSQL.');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(20) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        aplicada_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tabla schema_migrations lista.');

    const archivos = await readdir(migrationsDir);

    const migraciones = archivos
      .filter((archivo) => /^\d{3}_.+\.sql$/.test(archivo))
      .sort();

    console.log('📂 Migraciones encontradas:', migraciones);

    for (const archivo of migraciones) {
      const version = archivo.slice(0, 3);

      const rutaArchivo = path.join(
        migrationsDir,
        archivo
      );

      const resultado = await client.query(
        `
          SELECT version
          FROM schema_migrations
          WHERE version = $1;
        `,
        [version]
      );

      const yaAplicada = resultado.rowCount > 0;

      if (yaAplicada) {
        console.log(`✅ ${archivo} — YA APLICADA`);
        continue;
      }

      console.log(`⏳ ${archivo} — PENDIENTE`);

      const sql = await readFile(
        rutaArchivo,
        'utf8'
      );

      try {
        await client.query('BEGIN');

        await client.query(sql);

        await client.query(
          `
            INSERT INTO schema_migrations (
              version,
              nombre
            )
            VALUES ($1, $2);
          `,
          [version, archivo]
        );

        await client.query('COMMIT');

        console.log(`✅ ${archivo} — APLICADA`);
      } catch (error) {
        await client.query('ROLLBACK');

        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error ejecutando migraciones.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await ejecutarMigraciones();