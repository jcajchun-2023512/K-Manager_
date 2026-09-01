import { createApp } from './app';
import { env } from '@config/env';
import { initializeDatabase } from '@config/database';

async function bootstrap() {
  try {
    await initializeDatabase();
    const app = createApp();

    app.listen(env.port, () => {
      console.log(`🚀 K-Manager API corriendo en http://localhost:${env.port}`);
      console.log(`   Entorno: ${env.nodeEnv}`);
      console.log(`   Base de datos: PostgreSQL (${env.db.name})`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
