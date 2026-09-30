import { env } from './config/env';
import { createApp } from './app';

const app = createApp();

import { checkDatabase } from './config/db';
import { logger } from './shared/logger';

const start  = async(): Promise<void> =>{
  checkDatabase().then((result) =>{
    if (result.ok) console.log("DB connected");
    else console.warn('DB not configured or unreachable:', result);
  }).catch((err) =>{
    console.log(`DB connection failed:`, err.message)
  });

  const server = app.listen(env.port, () =>{
    console.log(`TOM-PHENOM API listening on http://localhost:${env.port}`);
  })

  const shutdown = async (signal: string): Promise<void> => {
    // logger
    logger.info("Recieved a shutdown signal")

    server.close(async ()=>{
      try {
        
        // await disconnectDatabase();
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 30_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) =>{
  console.log(err, "Failed to start");
  process.exit(1);
});
