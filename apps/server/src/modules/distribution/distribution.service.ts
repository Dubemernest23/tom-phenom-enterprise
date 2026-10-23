import { Decimal } from 'decimal.js';
import type { DistributionRecord } from '../../database/types.js';
import { BadRequestError, NotFoundError } from '../../shared/appError.js';
import { distributionRepository, type DistributionRepository } from './distribution.repo.js';
import type { AddDistributionTransferInput, CreateDistributionInput, ListDistributionQuery } from './distribution.val.js';

const MAX_EXPECTED = new Decimal('9999999999.99');

export class DistributionService {
  constructor(private readonly repo: DistributionRepository) {}

  list(query: ListDistributionQuery): Promise<DistributionRecord[]> {
    return this.repo.list(query.channel === 'all' ? undefined : query.channel);
  }

  async getById(id: number) {
    const detail = await this.repo.findDetail(id);
    if (!detail) throw new NotFoundError('Distribution record not found');
    const transferTotal = detail.transfers.reduce(
      (total, transfer) => total.plus(transfer.amount), new Decimal(0),
    );
    const liveBalance = new Decimal(detail.record.amount_expected)
      .minus(detail.record.amount_returned).minus(transferTotal);
    return {
      ...detail.record,
      transfers: detail.transfers,
      total_transfers: transferTotal.toFixed(2),
      calculated_balance: liveBalance.toFixed(2),
      balance_is_current: liveBalance.eq(detail.record.balance),
    };
  }

  create(input: CreateDistributionInput): Promise<DistributionRecord> {
    const expected = this.expectedAmount(input);
    return this.repo.create({
      ...input,
      recipient_name: input.recipient_name,
      amount_returned: input.amount_returned,
      amount_expected: expected.toFixed(2),
      balance: expected.minus(input.amount_returned).toFixed(2),
    });
  }

  async update(id: number, input: CreateDistributionInput): Promise<DistributionRecord> {
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundError('Distribution record not found');
    const expected = this.expectedAmount(input);
    const updated = await this.repo.update(id, {
      ...input,
      amount_expected: expected.toFixed(2),
    });
    if (!updated) throw new NotFoundError('Distribution record not found');
    return updated;
  }

  async addTransfer(id: number, input: AddDistributionTransferInput) {
    const detail = await this.repo.findDetail(id);
    if (!detail) throw new NotFoundError('Distribution record not found');
    const totalTransfers = detail.transfers.reduce(
      (total, transfer) => total.plus(transfer.amount), new Decimal(input.amount),
    );
    const resultingBalance = new Decimal(detail.record.amount_expected)
      .minus(detail.record.amount_returned).minus(totalTransfers);
    if (resultingBalance.abs().gt(MAX_EXPECTED)) {
      throw new BadRequestError('The transfer would make the balance exceed the supported amount.');
    }
    return this.repo.addTransfer({
      distribution_id: id,
      transfer_date: input.transfer_date,
      amount: input.amount,
      note: input.note || null,
    });
  }

  async calculate(id: number) {
    const detail = await this.repo.findDetail(id);
    if (!detail) throw new NotFoundError('Distribution record not found');
    const transferTotal = detail.transfers.reduce(
      (total, transfer) => total.plus(transfer.amount), new Decimal(0),
    );
    const balance = new Decimal(detail.record.amount_expected)
      .minus(detail.record.amount_returned).minus(transferTotal).toFixed(2);
    if (new Decimal(balance).abs().gt(MAX_EXPECTED)) {
      throw new BadRequestError('Calculated balance exceeds the supported amount.');
    }
    await this.repo.updateBalance(id, balance);
    return this.getById(id);
  }

  private expectedAmount(input: CreateDistributionInput): Decimal {
    const expected = new Decimal(input.quantity_given).mul(input.price_per_bag)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    if (expected.gt(MAX_EXPECTED)) throw new BadRequestError('Expected amount is too large.');
    return expected;
  }
}

export const distributionService = new DistributionService(distributionRepository);
