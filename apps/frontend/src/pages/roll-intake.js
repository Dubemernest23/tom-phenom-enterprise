import { getRollIntakes, createRollIntake } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNaira, formatDate, todayISO } from '../utils.js';

export async function render(container) {
  container.innerHTML = `
    <h1 class="font-heading text-xl font-semibold text-ink">Roll intake</h1>

    <form id="roll-intake-form" class="mt-6 flex flex-col gap-4">
      ${formField({ name: 'intake_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'quantity_rolls', label: 'Quantity of rolls', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'total_kg', label: 'Total kg', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'price_per_kg', label: 'Price per kg', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'amount_paid', label: 'Amount paid', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      ${formField({ name: 'supplier_name', label: 'Supplier (optional)', required: false })}
      <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save roll intake</button>
    </form>

    <div id="roll-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">Recent records</h2>
    <div id="roll-list" class="mt-3"></div>`;

  var form = container.querySelector('#roll-intake-form');
  var summaryEl = container.querySelector('#roll-summary');
  var listEl = container.querySelector('#roll-list');

  loadList(listEl);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      intake_date: fd.get('intake_date'),
      quantity_rolls: Number(fd.get('quantity_rolls')),
      total_kg: Number(fd.get('total_kg')),
      price_per_kg: Number(fd.get('price_per_kg')),
      amount_paid: Number(fd.get('amount_paid')),
      supplier_name: String(fd.get('supplier_name') || '').trim() || null,
    };

    try {
      var result = await createRollIntake(body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Roll intake saved</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Total price: <span class="font-semibold tabular-nums">${formatNaira(result.total_price)}</span></p>
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-debt' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var emptyMsg = listEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    listEl.insertAdjacentHTML('afterbegin', row(result));

    form.reset();
    form.elements.intake_date.value = todayISO();
    form.elements.amount_paid.value = '0';
  });
}

async function loadList(listEl) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  try {
    var records = await getRollIntakes();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!records || records.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No roll intake records yet. Add your first entry above.</p>';
    return;
  }
  listEl.innerHTML = records.map(row).join('');
}

function row(r) {
  var bal = r.balance > 0 ? 'Owed ' + formatNaira(r.balance) : '—';
  return listRow([
    { value: formatDate(r.intake_date || r.date), className: 'text-ink' },
    { value: r.total_kg != null ? r.total_kg + ' kg' : '—', className: 'text-ink' },
    { value: formatNaira(r.total_price), className: 'text-ink' },
    { value: bal, className: r.balance > 0 ? 'font-semibold text-debt' : 'text-ink-muted' },
  ]);
}