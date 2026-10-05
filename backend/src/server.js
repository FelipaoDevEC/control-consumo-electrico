import app from './app.js';
import { env } from './config/env.js';
import { pool, verificarConexionBD } from './db/pool.js';

// ─────────────────────────────────────────────
// Abrir el restaurante (solo si la bodega responde)
// ─────────────────────────────────────────────
async function iniciar() {
  try {
    const bd = await verificarConexionBD();

    const servidor = app.listen(env.port, () => {
      console.log('⚡ Control de Consumo Eléctrico — API');
      console.log(`   Modo:    ${env.nodeEnv}`);
      console.log(`   Puerto:  ${env.port}`);
      console.log(`   Bodega:  ${bd.base} (usuario ${bd.usuario})`);
      console.log(`   URL:     http://localhost:${env.port}/api/health`);
    });

    prepararCierre(servidor);
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL. El servidor NO se abrió.');
    console.error(`   Motivo: ${error.message}`);

    await pool.end();
    process.exitCode = 1;
  }
}

// ─────────────────────────────────────────────
// Cerrar con calma: primero la puerta, luego los carritos
// ─────────────────────────────────────────────
function prepararCierre(servidor) {
  let cerrando = false;

  async function cerrar(senal) {
    if (cerrando) return;
    cerrando = true;

    console.log(`\n👋 ${senal} recibido. Cerrando con calma...`);

    servidor.close(async () => {
      await pool.end();
      console.log('✅ Servidor y conexiones cerrados.');
      process.exit(0);
    });
  }

  process.on('SIGINT', () => cerrar('SIGINT'));
  process.on('SIGTERM', () => cerrar('SIGTERM'));
}

iniciar();