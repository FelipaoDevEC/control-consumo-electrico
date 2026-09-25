import { defineConfig } from 'vitest/config';

// ⚙️ Instrucciones para el robot probador
export default defineConfig({
  test: {
    // Somos un backend: probamos con Node, no con un navegador
    environment: 'node',

    // Dónde buscar las pruebas: cualquier archivo que termine en .test.js
    include: ['tests/**/*.test.js'],

    // Un archivo de pruebas a la vez.
    // Más adelante varias pruebas usarán la MISMA base de datos de test,
    // y si corren al mismo tiempo se pisarían entre ellas.
    fileParallelism: false,

    // Si una prueba tarda más de 10 segundos, algo está mal
    testTimeout: 10_000,
  },
});