import { z } from 'zod';

// 🔢 Un identificador que llega por la URL: /api/lecturas/15
// Llega como texto ("15"), así que lo convertimos a número (coerce)
export const idSchema = z.coerce
  .number({ error: 'El identificador debe ser un número.' })
  .int({ error: 'El identificador debe ser un número entero.' })
  .positive({ error: 'El identificador debe ser mayor que cero.' });