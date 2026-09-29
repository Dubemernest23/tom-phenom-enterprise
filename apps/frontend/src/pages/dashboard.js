import { getDashboardSummary } from '../api.js';
import { kpiCard } from '../components/kpi-card.js';
import { formatNaira, formatNumber, formatKg } from '../utils.js';

export async function render(container) {
  container.innerHTML = '<p class="text-ink-muted py-4">Loading dashboard...</p>';
  try {
    var data = await getDashboardSummary();
  } catch (err) {
    container.innerHTML = '<p class="text-debt py-4">Failed to load dashboard: ' + err.message + '</p>';
    return;
  }

  var production = data.todayProduction || 0;
  var owesUs = data.owedToUs || 0;
  var weOweAmt = data.weOwe || 0;
  var rollsKg = data.rollsThisMonthKg || 0;
  var bagsLeft = data.bagsRemaining || 0;

  container.innerHTML = `
    <section>
      <p class="text-sm font-medium text-ink-muted">Today</p>
      ${production > 0
        ? '<p class="mt-1 font-heading text-3xl font-bold text-ink tabular-nums">' + formatNumber(production) + ' bags</p>'
        : '<p class="mt-2 text-lg text-ink-muted">No factory log for today yet</p>' +
          '<a href="#/factory-log" class="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 py-3 text-base font-medium text-surface hover:bg-primary-dark">Log today\'s production</a>'
      }
    </section>

    <section class="mt-6 grid grid-cols-2 gap-4">
      ${kpiCard({ label: 'Owed to us', value: formatNaira(owesUs), valueClass: owesUs > 0 ? 'text-warning' : 'text-ink-muted', route: '#/customers' })}
      ${kpiCard({ label: 'We owe', value: formatNaira(weOweAmt), valueClass: weOweAmt > 0 ? 'text-debt' : 'text-ink-muted', route: '#/payables' })}
    </section>

    <section class="mt-4 grid grid-cols-2 gap-4">
      ${kpiCard({ label: 'Rolls this month', value: formatKg(rollsKg), route: '#/roll-intake' })}
      ${kpiCard({ label: 'Bags remaining', value: formatNumber(bagsLeft), route: '#/packing-bags' })}
    </section>

    <section class="mt-8">
      <p class="mb-3 text-sm font-medium text-ink-muted">Quick actions</p>
      <div class="grid grid-cols-2 gap-3">
        <a href="#/roll-intake" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Roll</a>
        <a href="#/factory-log" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Log</a>
        <a href="#/distribution" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Distribution</a>
        <a href="#/customers" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Customer txn</a>
      </div>
    </section>`;
}