import { Router } from 'express';

// Un mini-restaurante que solo atiende el tema "salud"
const router = Router();

// GET /api/health → "¿El backend está vivo?"
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

export default router;