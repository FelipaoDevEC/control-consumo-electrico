import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedsDir = path.join(
  __dirname,
  '..',
  'database',
  'seeds'
);

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function ejecutarSeeds() {
  try {
    await client.connect();

    console.log('✅ Conectado a PostgreSQL.');
    console.log(`📦 Base de datos: ${process.env.DB_NAME}`);

    const archivos = await readdir(seedsDir);

    const seeds = archivos
      .filter((archivo) => /^\d{3}_.+\.sql$/.test(archivo))
      .sort();

    console.log('🌱 Seeds encontrados:', seeds);

    for (const archivo of seeds) {
      const rutaArchivo = path.join(
        seedsDir,
        archivo
      );

      const sql = await readFile(
        rutaArchivo,
        'utf8'
      );

      await client.query(sql);

      console.log(`✅ ${archivo} — EJECUTADO`);
    }
  } catch (error) {
    console.error('❌ Error ejecutando seeds.');
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

await ejecutarSeeds();