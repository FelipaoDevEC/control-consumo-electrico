import { pool } from './pool.js';

// 🤝 Ayudante "todo o nada".
// Uso:
//   await ejecutarTransaccion(async (client) => {
//     await client.query(...);   // ⚠️ SIEMPRE client, nunca pool
//     await client.query(...);
//   });
export async function ejecutarTransaccion(trabajo) {
  // 🛒 1. Tomar UN carrito y quedárnoslo hasta el final
  const client = await pool.connect();
  let carritoRoto = false;

  try {
    // 📝 2. Abrir el cuaderno de borrador
    await client.query('BEGIN');

    // 🧱 3. Hacer todos los pasos del trabajo
    const resultado = await trabajo(client);

    // ✅ 4. Todo salió bien: pasar al cuaderno oficial
    await client.query('COMMIT');

    return resultado;
  } catch (error) {
    // 🗑️ 5. Algo falló: arrancar la hoja de borrador
    try {
      await client.query('ROLLBACK');
    } catch (errorAlDeshacer) {
      carritoRoto = true;
      console.error('⚠️ No se pudo deshacer la transacción:', errorAlDeshacer.message);
    }

    // El error original sigue su camino (hasta el mostrador de reclamos)
    throw error;
  } finally {
    // 🛒 6. SIEMPRE devolver el carrito, pase lo que pase.
    //    Si se rompió, no vuelve a la fila: se manda a reciclar.
    client.release(carritoRoto);
  }
}