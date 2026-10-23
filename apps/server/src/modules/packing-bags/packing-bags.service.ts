import { BadRequestError, NotFoundError } from '../../shared/appError.js';
import { packingBagsRepository, type PackingBagsRepository } from './packing-bags.repo.js';
import type { CreatePackingBagBatchInput, UsePackingBagBatchInput } from './packing-bags.val.js';

export class PackingBagsService {
  constructor(private readonly repo: PackingBagsRepository) {}

  list() {
    return this.repo.list();
  }

  async getById(id: number) {
    const detail = await this.repo.findById(id);
    if (!detail) throw new NotFoundError('Packing bag batch not found');
    return detail;
  }

  create(input: CreatePackingBagBatchInput) {
    return this.repo.create({
      received_date: input.received_date,
      quantity_received: input.quantity_received,
      quantity_used: 0,
      quantity_remaining: input.quantity_received,
      note: input.note || null,
    });
  }

  async use(id: number, input: UsePackingBagBatchInput) {
    const result = await this.repo.useBatch(id, input.usage_date, input.quantity_used);
    if (result.status === 'not_found') throw new NotFoundError('Packing bag batch not found');
    if (result.status === 'insufficient') {
      throw new BadRequestError('Quantity used cannot be more than the bags remaining in this batch.');
    }
    return result.batch;
  }
}

export const packingBagsService = new PackingBagsService(packingBagsRepository);
