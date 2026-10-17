import { getRollIntakes, createRollIntake } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNaira, formatDate, todayISO, escapeHtml } from '../utils.js';

const PAGE_SIZE = 20;

const PRIMARY_BTN = 'min-h-11 rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark';
const OUTLINE_BTN = 'min-h-11 rounded-lg border border-primary px-4 py-3 text-base font-medium text-primary hover:bg-surface-alt';

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
      <button type="submit" class="mt-2 w-full ${PRIMARY_BTN}">Save roll intake</button>
    </form>

    <div id="roll-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">Recent records</h2>

    <form id="roll-filter" class="mt-3 flex flex-col gap-4">
      ${formField({ name: 'from', label: 'From date', type: 'date', required: false })}
      ${formField({ name: 'to', label: 'To date', type: 'date', required: false })}
      <div class="flex gap-3">
        <button type="submit" class="${OUTLINE_BTN}">Apply filter</button>
        <button type="button" id="roll-filter-clear" class="${OUTLINE_BTN}">Clear</button>
      </div>
    </form>

    <div id="roll-list" class="mt-3"></div>
    <div id="roll-more" class="mt-4"></div>`;

  var form = container.querySelector('#roll-intake-form');
  var filterForm = container.querySelector('#roll-filter');
  var summaryEl = container.querySelector('#roll-summary');
  var listEl = container.querySelector('#roll-list');
  var moreEl = container.querySelector('#roll-more');

  // The filters are only copied from the form when the user presses Apply or Clear.
  // A cursor is only valid together with the filters it was created under, so
  // "Load more" must keep using this saved copy, not whatever is typed in the form.
  var filters = { from: '', to: '' };
  var nextCursor = null;

  // reset = true starts again from the newest record; false appends the next page.
  async function loadList(reset) {
    if (reset) {
      nextCursor = null;
      moreEl.innerHTML = '';
      listEl.innerHTML = '<p class="py-2 text-ink-muted">Loading...</p>';
    }

    var page;
    try {
      page = await getRollIntakes({
        from: filters.from,
        to: filters.to,
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
    } catch (err) {
      if (reset) listEl.innerHTML = '';
      listEl.insertAdjacentHTML('beforeend', '<p class="py-2 text-debt">' + escapeHtml(err.message) + '</p>');
      return;
    }

    if (reset) listEl.innerHTML = '';

    if (reset && page.items.length === 0) {
      var filtered = filters.from || filters.to;
      listEl.innerHTML = '<p class="py-2 text-ink-muted">' +
        (filtered ? 'No roll intake records in that date range.' : 'No roll intake records yet. Add your first entry above.') +
        '</p>';
      return;
    }

    listEl.insertAdjacentHTML('beforeend', page.items.map(row).join(''));
    nextCursor = page.nextCursor;
    moreEl.innerHTML = nextCursor
      ? '<button type="button" id="roll-load-more" class="w-full ' + OUTLINE_BTN + '">Load more</button>'
      : '';
  }

  loadList(true);

  filterForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(filterForm);
    filters = { from: fd.get('from') || '', to: fd.get('to') || '' };
    loadList(true);
  });

  container.querySelector('#roll-filter-clear').addEventListener('click', function () {
    filterForm.reset();
    filters = { from: '', to: '' };
    loadList(true);
  });

  moreEl.addEventListener('click', function (e) {
    var btn = e.target.closest('#roll-load-more');
    if (!btn) return;
    btn.disabled = true;
    loadList(false).finally(function () { btn.disabled = false; });
  });

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

    var result;
    try {
      result = await createRollIntake(body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + escapeHtml(err.message) + '</p>';
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

    // The list is sorted by date and paginated, so reload from the first page
    // instead of prepending: the new record may not belong at the top.
    loadList(true);

    form.reset();
    form.elements.intake_date.value = todayISO();
    form.elements.amount_paid.value = '0';
  });
}

function row(r) {
  var bal = r.balance > 0 ? 'Owed ' + formatNaira(r.balance) : '—';
  return listRow([
    { value: formatDate(r.intake_date), className: 'text-ink' },
    { value: r.total_kg != null ? r.total_kg + ' kg' : '—', className: 'text-ink' },
    { value: formatNaira(r.total_price), className: 'text-ink' },
    { value: bal, className: r.balance > 0 ? 'font-semibold text-debt' : 'text-ink-muted' },
  ]);
}