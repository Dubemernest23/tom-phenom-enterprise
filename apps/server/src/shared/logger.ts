//server/src/shared/loggers/pino.loggers.ts
import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(env.isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});