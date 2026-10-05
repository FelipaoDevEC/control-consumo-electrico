import express from 'express';
import rutas from './routes/index.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;