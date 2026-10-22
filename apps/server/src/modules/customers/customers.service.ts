import { Decimal } from 'decimal.js';
import { BadRequestError, NotFoundError } from '../../shared/appError.js';
import { customersRepository, type CustomersRepository } from './customers.repo.js';
import type { CreateCustomerInput, CreateCustomerTransactionInput } from './customers.val.js';

const MAX_BALANCE = new Decimal('9999999999.99');

export class CustomersService {
  constructor(private readonly repo: CustomersRepository) {}
  list() { return this.repo.list(); }
  async getById(id: number) {
    const result = await this.repo.detail(id);
    if (!result) throw new NotFoundError('Customer not found');
    return result;
  }
  create(input: CreateCustomerInput) { return this.repo.create({ name: input.name, phone: input.phone || null }); }
  async addTransaction(id: number, input: CreateCustomerTransactionInput) {
    if (!(await this.repo.findById(id))) throw new NotFoundError('Customer not found');
    const expected = input.amount_expected === undefined
      ? new Decimal(input.quantity).mul(input.price_given).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(input.amount_expected);
    const balance = expected.minus(input.amount_paid);
    if (input.payment_status === 'paid' && balance.gt(0)) throw new BadRequestError('Mark this transaction as paid only after the full expected amount is received.');
    if (expected.gt(MAX_BALANCE) || balance.abs().gt(MAX_BALANCE)) {
      throw new BadRequestError('Transaction amount or resulting balance is too large.');
    }
    return this.repo.addTransaction({
      customer_id: id, txn_date: input.txn_date, quantity: input.quantity,
      price_given: String(input.price_given), amount_expected: expected.toFixed(2),
      amount_paid: String(input.amount_paid), balance: balance.toFixed(2),
      payment_method: input.payment_method,
      payment_status: input.payment_status,
      payment_date: input.amount_paid > 0 ? input.payment_date || input.txn_date : null,
    });
  }

  async updateTransaction(id: number, transactionId: number, input: CreateCustomerTransactionInput) {
    if (!(await this.repo.findById(id))) throw new NotFoundError('Customer not found');
    const expected = input.amount_expected === undefined
      ? new Decimal(input.quantity).mul(input.price_given).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(input.amount_expected);
    const balance = expected.minus(input.amount_paid);
    if (input.payment_status === 'paid' && balance.gt(0)) throw new BadRequestError('Mark this transaction as paid only after the full expected amount is received.');
    if (expected.gt(MAX_BALANCE) || balance.abs().gt(MAX_BALANCE)) throw new BadRequestError('Transaction amount or resulting balance is too large.');
    const updated = await this.repo.updateTransaction(id, transactionId, {
      txn_date: input.txn_date, quantity: input.quantity, price_given: String(input.price_given),
      amount_expected: expected.toFixed(2), amount_paid: String(input.amount_paid), balance: balance.toFixed(2),
      payment_method: input.payment_method, payment_status: input.payment_status,
      payment_date: input.amount_paid > 0 ? input.payment_date || input.txn_date : null,
    });
    if (!updated) throw new NotFoundError('Customer transaction not found');
    return updated;
  }
}

export const customersService = new CustomersService(customersRepository);
