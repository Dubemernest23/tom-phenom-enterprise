import { NotFoundError } from '../../shared/appError.js';
import { payrollRepository, type PayrollRepository } from '../payroll/payroll.repo.js';
import type { CreateWorkerInput, StaffRatingInput } from '../payroll/payroll.val.js';
import { payrollService } from '../payroll/payroll.service.js';

export class StaffService {
  constructor(private readonly repo: PayrollRepository) {}
  async list() {
    const workers = await payrollService.list();
    return Promise.all(workers.map(async (worker) => ({ ...worker, latest_rating: await this.repo.latestRating(worker.id) })));
  }
  async getById(id: number) {
    const staff = await payrollService.getById(id);
    if (!staff) throw new NotFoundError('Staff member not found');
    return staff;
  }
  create(input: CreateWorkerInput) {
    return this.repo.createWorker({
      ...input, role: input.role || null, state_of_origin: input.state_of_origin || null,
      genotype: input.genotype || null, blood_group: input.blood_group || null,
      base_salary: input.salary_frequency === 'monthly' ? String(input.base_salary) : null,
    });
  }
  async update(id: number, input: CreateWorkerInput) {
    if (!(await this.repo.findWorker(id))) throw new NotFoundError('Staff member not found');
    return this.repo.updateWorker(id, {
      ...input, role: input.role || null, state_of_origin: input.state_of_origin || null,
      genotype: input.genotype || null, blood_group: input.blood_group || null,
      base_salary: input.salary_frequency === 'monthly' ? String(input.base_salary) : null,
    });
  }
  async rate(id: number, input: StaffRatingInput) {
    if (!(await this.repo.findWorker(id))) throw new NotFoundError('Staff member not found');
    const ratingMonth = `${input.rating_month.slice(0, 7)}-01`;
    return this.repo.saveRating({ worker_id: id, rating_month: ratingMonth, rating: input.rating, note: input.note || null });
  }
}
export const staffService = new StaffService(payrollRepository);
