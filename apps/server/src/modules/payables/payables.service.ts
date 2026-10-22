import { Decimal } from 'decimal.js';
import { BadRequestError, NotFoundError } from '../../shared/appError.js';
import { payablesRepository, type PayablesRepository } from './payables.repo.js';
import type { CreateCreditorInput, CreatePayableTransactionInput } from './payables.val.js';

const MAX = new Decimal('9999999999.99');
export class PayablesService {
  constructor(private readonly repo: PayablesRepository) {}
  list() { return this.repo.list(); }
  async getById(id: number) {
    const detail = await this.repo.detail(id);
    if (!detail) throw new NotFoundError('Creditor not found');
    return detail;
  }
  create(input: CreateCreditorInput) { return this.repo.create({ name: input.name, category: input.category || null }); }
  async addTransaction(id: number, input: CreatePayableTransactionInput) {
    if (!(await this.repo.findCreditor(id))) throw new NotFoundError('Creditor not found');
    const balance = new Decimal(input.amount_owed).minus(input.amount_paid);
    if (balance.abs().gt(MAX)) throw new BadRequestError('Transaction balance exceeds the supported amount.');
    return this.repo.addTransaction({
      creditor_id: id, txn_date: input.txn_date, description: input.description || null,
      amount_owed: String(input.amount_owed), amount_paid: String(input.amount_paid), balance: balance.toFixed(2),
    });
  }
}
export const payablesService = new PayablesService(payablesRepository);
