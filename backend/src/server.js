import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log('⚡ Control de Consumo Eléctrico — API');
  console.log(`   Modo:   ${env.nodeEnv}`);
  console.log(`   Puerto: ${env.port}`);
  console.log(`   Base:   ${env.db.name}`);
  console.log(`   URL:    http://localhost:${env.port}/api/health`);
});