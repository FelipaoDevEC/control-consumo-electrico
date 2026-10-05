import express from 'express';
import helmet from 'helmet';
import rutas from './routes/index.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 🪖 3. Casco de seguridad: etiquetas seguras en cada respuesta
app.use(helmet());

// 📄 4. Guardia que sabe leer comandas en formato JSON
app.use(express.json());

// 🗂️ 5. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 6. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 7. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;