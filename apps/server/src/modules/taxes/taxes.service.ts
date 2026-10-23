import { Decimal } from 'decimal.js';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/appError.js';
import { taxesRepository, type TaxesRepository } from './taxes.repo.js';
import type { TaxRecordInput } from './taxes.val.js';
const MAX = new Decimal('9999999999.99');
export class TaxesService {
  constructor(private readonly repo: TaxesRepository) {}
  list() { return this.repo.list(); }
  async get(id: number) { const record = await this.repo.find(id); if (!record) throw new NotFoundError('Tax record not found'); return record; }
  private values(input: TaxRecordInput) {
    const balance = new Decimal(input.amount_due).minus(input.amount_paid);
    if (balance.abs().gt(MAX)) throw new BadRequestError('Tax balance exceeds supported amount.');
    return { ...input, payment_date: input.amount_paid > 0 ? input.payment_date || input.due_date : null,
      amount_due: String(input.amount_due), amount_paid: String(input.amount_paid), balance: balance.toFixed(2) };
  }
  async create(input: TaxRecordInput) {
    if (await this.repo.findPeriod(input.tax_name, input.description, input.period_label)) throw new ConflictError('A tax record already exists for this tax and period. Edit the existing entry.');
    return this.repo.create(this.values(input));
  }
  async update(id: number, input: TaxRecordInput) {
    if (!(await this.repo.find(id))) throw new NotFoundError('Tax record not found');
    if (await this.repo.findPeriod(input.tax_name, input.description, input.period_label, id)) throw new ConflictError('A tax record already exists for this tax and period.');
    return this.repo.update(id, this.values(input));
  }
}
export const taxesService = new TaxesService(taxesRepository);
