import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { checkDatabase } from './config/db';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { authRouter } from './modules/auth/auth.routes';
import { customersRouter } from './modules/customers/customers.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { distributionRouter } from './modules/distribution/distribution.routes';
import { factoryLogRouter } from './modules/factory-log/factory-log.routes';
import { maintenanceRouter } from './modules/maintenance/maintenance.routes';
import { packingBagsRouter } from './modules/packing-bags/packing-bags.routes';
import { payablesRouter } from './modules/payables/payables.routes';
import { payrollRouter } from './modules/payroll/payroll.routes';
import { rollIntakeRouter } from './modules/roll-intake/roll-intake.routes';
import { asyncHandler } from './utils/http';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/health', asyncHandler(async (_req, res) => {
    const database = await checkDatabase().catch(() => ({ configured: Boolean(env.databaseUrl), ok: false }));
    res.json({
      status: 'ok',
      service: 'tom-phenom-server',
      database,
    });
  }));

  app.use('/api/auth', authRouter);
  app.use('/api', requireAuth);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/roll-intake', rollIntakeRouter);
  app.use('/api/packing-bags', packingBagsRouter);
  app.use('/api/factory-log', factoryLogRouter);
  app.use('/api/distribution', distributionRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/payroll', payrollRouter);
  app.use('/api/maintenance', maintenanceRouter);
  app.use('/api/payables', payablesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
