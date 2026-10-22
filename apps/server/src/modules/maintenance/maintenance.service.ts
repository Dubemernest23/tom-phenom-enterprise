import { maintenanceRepository, type MaintenanceRepository } from './maintenance.repo.js';
import type { CreateMaintenanceInput } from './maintenance.val.js';

export class MaintenanceService {
  constructor(private readonly repo: MaintenanceRepository) {}
  list() { return this.repo.list(); }
  create(input: CreateMaintenanceInput) {
    return this.repo.create({ ...input, description: input.description || null, vendor: input.vendor || null, cost: String(input.cost) });
  }
}
export const maintenanceService = new MaintenanceService(maintenanceRepository);
