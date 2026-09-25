import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../../src/db/pool.js';
import { ejecutarTransaccion } from '../../src/db/transaction.js';

async function monedasDe(nombre) {
  const { rows } = await pool.query(
    'SELECT monedas FROM test_alcancias WHERE nombre = $1',
    [nombre]
  );
  return rows[0].monedas;
}

const sacarDeAna = "UPDATE test_alcancias SET monedas = monedas - 5 WHERE nombre = 'Ana'";
const darABeto = "UPDATE test_alcancias SET monedas = monedas + 5 WHERE nombre = 'Beto'";

// 🍳 Una vez: sacar los utensilios
beforeAll(async () => {
  await pool.query('DROP TABLE IF EXISTS test_alcancias');
  await pool.query(`
    CREATE TABLE test_alcancias (
      nombre  TEXT PRIMARY KEY,
      monedas INTEGER NOT NULL
    )
  `);
});

// 🧽 Antes de cada prueba: Ana 10, Beto 0
beforeEach(async () => {
  await pool.query('DELETE FROM test_alcancias');
  await pool.query(
    "INSERT INTO test_alcancias (nombre, monedas) VALUES ('Ana', 10), ('Beto', 0)"
  );
});

// 🧹 Al final: dejar la cocina limpia y cerrar los carritos
afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS test_alcancias');
  await pool.end();
});

describe('🤝 Transacciones todo o nada', () => {
  it('COMMIT: si todo sale bien, se guardan todos los pasos', async () => {
    await ejecutarTransaccion(async (client) => {
      await client.query(sacarDeAna);
      await client.query(darABeto);
    });

    expect(await monedasDe('Ana')).toBe(5);
    expect(await monedasDe('Beto')).toBe(5);
  });

  it('ROLLBACK: si algo falla, no se guarda NINGÚN paso', async () => {
    await expect(
      ejecutarTransaccion(async (client) => {
        await client.query(sacarDeAna);
        throw new Error('⚡ ¡Se cortó la luz!');
      })
    ).rejects.toThrow('Se cortó la luz');

    expect(await monedasDe('Ana')).toBe(10); // 🐷 ¡nada se perdió!
    expect(await monedasDe('Beto')).toBe(0);
  });

  it('devuelve el resultado del trabajo', async () => {
    const resultado = await ejecutarTransaccion(async () => 'listo');

    expect(resultado).toBe('listo');
  });

  it('siempre devuelve el carrito: 15 fallos seguidos no agotan el pool', async () => {
    for (let i = 0; i < 15; i++) {
      await expect(
        ejecutarTransaccion(async () => {
          throw new Error('falla');
        })
      ).rejects.toThrow('falla');
    }

    // Si algún carrito no se hubiera devuelto, aquí nos quedaríamos sin carritos 🥶
    const uno = await ejecutarTransaccion(async (client) => {
      const { rows } = await client.query('SELECT 1 AS uno');
      return rows[0].uno;
    });

    expect(uno).toBe(1);
  });
});