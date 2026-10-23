import { getDashboardSummary } from '../api.js';
import { kpiCard } from '../components/kpi-card.js';
import { formatNaira, formatNumber, formatKg, formatDate } from '../utils.js';
import { getUserRole } from '../state.js';

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
  var customerWeek = data.customerSalesThisWeek || {};
  var weeklyDist = data.distributionThisWeek || {};
  var dailyDist = data.distributionToday || {};
  var salaryAlerts = data.salaryAlerts || [];
  var taxAlerts = data.taxAlerts || [];
  var isSupervisor = getUserRole() === 'SUPERVISOR';
  function channelSummary(channel, totals) {
    totals = totals || {};
    return `<div class="rounded-lg border border-line bg-surface p-4"><h3 class="font-semibold capitalize text-ink">${channel}</h3><p class="mt-2 text-sm text-ink-muted">${formatNumber(totals.quantity)} bags · Sales ${formatNaira(totals.expected)}</p><p class="mt-1 text-sm font-medium text-positive">Received ${formatNaira(totals.received)}</p></div>`;
  }

  container.innerHTML = `
    <section>
      <p class="text-sm font-medium text-ink-muted">Today</p>
      ${production > 0
        ? '<p class="mt-1 font-heading text-3xl font-bold text-ink tabular-nums">' + formatNumber(production) + ' bags</p>'
        : '<p class="mt-2 text-lg text-ink-muted">No factory log for today yet</p>' +
          (getUserRole() === 'ADMIN' ? '<a href="#/factory-log" class="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 py-3 text-base font-medium text-surface hover:bg-primary-dark">Log today\'s production</a>' : '')
      }
    </section>

    ${salaryAlerts.length ? `<section class="mt-5 rounded-lg border border-debt bg-surface p-4" aria-live="polite"><h2 class="font-heading text-lg font-semibold text-debt">Salary attention · ${salaryAlerts.length}</h2><div class="mt-2">${salaryAlerts.map((item) => `<a href="#/payroll/${item.worker_id}" class="flex flex-wrap justify-between gap-2 border-b border-line py-2 text-sm"><span class="font-medium text-ink">${item.status === 'overdue' ? 'Overdue' : 'Due today'} · ${item.name} · ${item.pay_period}</span><span class="tabular-nums text-debt">${formatNaira(item.balance)}</span></a>`).join('')}</div></section>` : ''}
    ${taxAlerts.length ? `<section class="mt-3 rounded-lg border border-warning bg-surface p-4" aria-live="polite"><h2 class="font-heading text-lg font-semibold text-warning">Tax attention · ${taxAlerts.length}</h2><div class="mt-2">${taxAlerts.map((item) => `<a href="#/taxes" class="flex flex-wrap justify-between gap-2 border-b border-line py-2 text-sm"><span class="font-medium text-ink">${item.status === 'overdue' ? 'Overdue' : 'Due today'} · ${item.tax_name} · ${item.description} (${item.period_label})</span><span class="tabular-nums text-warning">${formatNaira(item.balance)}</span></a>`).join('')}</div></section>` : ''}

    <section class="mt-6 grid grid-cols-2 gap-4 ${isSupervisor ? 'grid-cols-1' : ''}">
      ${kpiCard({ label: 'Owed to us', value: formatNaira(owesUs), valueClass: owesUs > 0 ? 'text-warning' : 'text-ink-muted', route: '#/customers' })}
      ${isSupervisor ? '' : kpiCard({ label: 'We owe', value: formatNaira(weOweAmt), valueClass: weOweAmt > 0 ? 'text-debt' : 'text-ink-muted', route: '#/payables', hint: `Includes ${formatNaira(data.salaryLiability)} in salary balances` })}
    </section>

    <section class="mt-4 grid grid-cols-2 gap-4">
      ${kpiCard({ label: 'Rolls this month', value: formatKg(rollsKg), route: '#/roll-intake' })}
      ${kpiCard({ label: 'Bags remaining', value: formatNumber(bagsLeft), route: '#/packing-bags' })}
    </section>

    ${getUserRole() === 'ADMIN' ? `<section class="mt-8">
      <h2 class="font-heading text-lg font-semibold text-ink">This week · Customers (${formatDate(data.weekStart)} – ${formatDate(data.weekEnd)})</h2>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div class="rounded-lg border border-line bg-surface p-4"><p class="text-sm text-ink-muted">Bags sold</p><p class="mt-1 font-heading text-xl font-bold tabular-nums text-ink">${formatNumber(customerWeek.quantity)}</p></div>
        <div class="rounded-lg border border-line bg-surface p-4"><p class="text-sm text-ink-muted">Expected sales</p><p class="mt-1 font-heading text-xl font-bold tabular-nums text-ink">${formatNaira(customerWeek.expected)}</p></div>
        <div class="rounded-lg border border-line bg-surface p-4"><p class="text-sm text-ink-muted">Money received</p><p class="mt-1 font-heading text-xl font-bold tabular-nums text-positive">${formatNaira(customerWeek.received)}</p></div>
        <div class="rounded-lg border border-line bg-surface p-4"><p class="text-sm text-ink-muted">Balance on this week's sales</p><p class="mt-1 font-heading text-xl font-bold tabular-nums text-warning">${formatNaira(customerWeek.balance)}</p></div>
      </div>
    </section>

    <section class="mt-8">
      <h2 class="font-heading text-lg font-semibold text-ink">This week · Distribution (${formatDate(data.weekStart)} – ${formatDate(data.weekEnd)})</h2>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">${channelSummary('Keke', weeklyDist.keke)}${channelSummary('Van', weeklyDist.van)}</div>
      <h3 class="mt-5 font-heading text-base font-semibold text-ink">Today</h3>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">${channelSummary('Keke', dailyDist.keke)}${channelSummary('Van', dailyDist.van)}</div>
    </section>

    <section class="mt-8">
      <p class="mb-3 text-sm font-medium text-ink-muted">Quick actions</p>
      <div class="grid grid-cols-2 gap-3">
        <a href="#/roll-intake" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Roll</a>
        <a href="#/factory-log" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Log</a>
        <a href="#/distribution" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Distribution</a>
        <a href="#/customers" class="flex min-h-11 items-center justify-center rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-primary hover:text-surface">+ Customer txn</a>
      </div>
    </section>` : ''}`;
}
