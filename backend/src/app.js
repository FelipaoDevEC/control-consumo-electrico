import express from 'express';
import rutas from './routes/index.js';

const app = express();

// Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

export default app;