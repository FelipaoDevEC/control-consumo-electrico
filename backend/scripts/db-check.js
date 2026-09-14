import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

try {
  await client.connect();

  console.log('✅ Conexión PostgreSQL correcta.');
  console.log(`📦 Base de datos: ${process.env.DB_NAME}`);
} catch (error) {
  console.error('❌ No se pudo conectar con PostgreSQL.');
  console.error(error.message);

  process.exitCode = 1;
} finally {
  await client.end();
}