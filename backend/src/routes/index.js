import { Router } from 'express';
import healthRoutes from './health.routes.js';

// El directorio del centro comercial:
// aquí se anota qué local atiende cada dirección
const router = Router();

router.use('/health', healthRoutes);

// Locales que abriremos más adelante:
// router.use('/auth', authRoutes);
// router.use('/lecturas', lecturasRoutes);

export default router;