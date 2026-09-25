import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rutas from './routes/index.js';
import { opcionesCors } from './config/cors.js';
import { asignarRequestId } from './middlewares/request-id.js';
import { registrarPeticion } from './middlewares/logger.js';
import { limitadorGeneral } from './middlewares/rate-limit.js';
import { rutaNoEncontrada } from './middlewares/not-found.js';
import { manejarErrores } from './middlewares/error-handler.js';

const app = express();

// 🎫 1. Ticket para cada pedido (siempre primero)
app.use(asignarRequestId);

// 📓 2. La bitácora anota todos los pedidos
app.use(registrarPeticion);

// 🪖 3. Casco de seguridad: etiquetas seguras en cada respuesta
app.use(helmet());

// 🚪 4. Lista de invitados: desde qué páginas nos pueden llamar
app.use(cors(opcionesCors));

// 🐢 5. "Calma, uno a la vez": máximo 120 pedidos por minuto
app.use(limitadorGeneral);

// 📄 6. Lector de comandas JSON, con buzón de máximo 100 KB
app.use(express.json({ limit: '100kb' }));

// 🗂️ 7. Todo lo que empiece con /api va al directorio de rutas
app.use('/api', rutas);

// 🤷 8. Si nadie atendió el pedido: "ese plato no está en el menú"
app.use(rutaNoEncontrada);

// 🛎️ 9. Mostrador de reclamos: SIEMPRE al final
app.use(manejarErrores);

export default app;