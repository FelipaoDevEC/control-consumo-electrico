import { describe, expect, it } from 'vitest';
import { env } from '../../src/config/env.js';

describe('Entorno de pruebas', () => {
  it('el robot corre en modo test', () => {
    expect(env.nodeEnv).toBe('test');
    expect(env.esTest).toBe(true);
  });

  it('usa la base de datos de juguete, nunca la real', () => {
    expect(env.db.name).toBe('consumo_electrico_test');
  });

  it('usa el puerto de pruebas', () => {
    expect(env.port).toBe(3001);
  });
});