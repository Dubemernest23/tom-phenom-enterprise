import type { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async summary(req: Request, res: Response) {
    const summary = await dashboardService.summary();
    if (req.user?.role?.toUpperCase() === 'SUPERVISOR') {
      res.json({ ...summary, weOwe: null, salaryLiability: null, salaryAlerts: [] });
      return;
    }
    res.json(summary);
  },
};
