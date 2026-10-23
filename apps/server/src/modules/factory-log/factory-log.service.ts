import type { DailyFactoryLog } from '../../database/types.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/appError.js';
import { factoryLogRepository, type FactoryLogRepository } from './factory-log.repo.js';
import type { CreateFactoryLogInput } from './factory-log.val.js';

export class FactoryLogService {
  constructor(private readonly repo: FactoryLogRepository) {}

  list(): Promise<DailyFactoryLog[]> {
    return this.repo.list();
  }

  create(input: CreateFactoryLogInput): Promise<DailyFactoryLog> {
    const computed = this.compute(input);
    return this.repo.create({ ...input, ...computed }).catch(mapUniqueDateError);
  }

  async update(id: number, input: CreateFactoryLogInput): Promise<DailyFactoryLog> {
    if (!(await this.repo.findById(id))) throw new NotFoundError('Factory log not found');
    const updated = await this.repo.update(id, { ...input, ...this.compute(input) }).catch(mapUniqueDateError);
    if (!updated) throw new NotFoundError('Factory log not found');
    return updated;
  }

  private compute(input: CreateFactoryLogInput) {
    const total_2 = input.distribution_qty + input.in_house_qty;
    const total_1 = total_2 + input.closing_stock;
    const production = total_1 - input.opening_stock;

    if (total_2 > 2_147_483_647 || total_1 > 2_147_483_647) {
      throw new BadRequestError('Combined quantities are too large.');
    }

    return { total_2, total_1, production };
  }
}

function mapUniqueDateError(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
    throw new ConflictError('A factory log already exists for this date. Edit that log to correct it.');
  }
  throw error;
}

export const factoryLogService = new FactoryLogService(factoryLogRepository);
