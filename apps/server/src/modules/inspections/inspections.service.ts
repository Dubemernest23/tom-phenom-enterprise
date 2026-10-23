import { NotFoundError } from '../../shared/appError.js';
import { inspectionsRepository, type InspectionsRepository } from './inspections.repo.js';
import type { InspectionInput } from './inspections.val.js';
export class InspectionsService {
  constructor(private readonly repo: InspectionsRepository) {}
  list() { return this.repo.list(); }
  async get(id: number) { const result = await this.repo.find(id); if (!result) throw new NotFoundError('Inspection record not found'); return result; }
  create(input: InspectionInput) { return this.repo.create({ ...input, recommendations: input.recommendations || null, fee_paid: String(input.fee_paid), tips_paid: String(input.tips_paid) }); }
  async update(id: number, input: InspectionInput) {
    if (!(await this.repo.find(id))) throw new NotFoundError('Inspection record not found');
    return this.repo.update(id, { ...input, recommendations: input.recommendations || null, fee_paid: String(input.fee_paid), tips_paid: String(input.tips_paid) });
  }
}
export const inspectionsService = new InspectionsService(inspectionsRepository);
