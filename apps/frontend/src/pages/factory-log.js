import { getFactoryLogs, createFactoryLog } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNumber, formatDate, todayISO } from '../utils.js';

export async function render(container) {
  container.innerHTML = `
    <h1 class="font-heading text-xl font-semibold text-ink">Daily factory log</h1>

    <div id="log-warning" class="mt-4"></div>

    <form id="log-form" class="mt-4 flex flex-col gap-4">
      ${formField({ name: 'log_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'opening_stock', label: 'Opening stock', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'closing_stock', label: 'Closing stock', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'distribution_qty', label: 'Distribution quantity', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'in_house_qty', label: 'In-house quantity', type: 'number', inputmode: 'numeric', min: 0 })}
      <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save factory log</button>
    </form>

    <div id="log-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">Past logs</h2>
    <div id="log-list" class="mt-3"></div>`;

  var form = container.querySelector('#log-form');
  var warningEl = container.querySelector('#log-warning');
  var summaryEl = container.querySelector('#log-summary');
  var listEl = container.querySelector('#log-list');
  var logs = [];

  function dateOf(r) {
    return r.log_date || r.date;
  }

  function warnDuplicate() {
    var val = form.elements.log_date.value;
    var duplicate = val && logs.some(function (r) { return dateOf(r) === val; });
    warningEl.innerHTML = duplicate
      ? '<p class="rounded-lg border border-warning bg-surface p-3 text-sm text-warning">A factory log already exists for ' + formatDate(val) + '. Saving will add a duplicate entry.</p>'
      : '';
  }

  loadList(listEl, function (data) {
    logs = data || [];
    warnDuplicate();
  });

  form.elements.log_date.addEventListener('change', warnDuplicate);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    warnDuplicate();

    var fd = new FormData(form);
    var body = {
      log_date: fd.get('log_date'),
      opening_stock: Number(fd.get('opening_stock')),
      closing_stock: Number(fd.get('closing_stock')),
      distribution_qty: Number(fd.get('distribution_qty')),
      in_house_qty: Number(fd.get('in_house_qty')),
    };

    var result;
    try {
      result = await createFactoryLog(body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    var merged = Object.assign({}, body, result);
    summaryEl.innerHTML = summary(merged);

    var emptyMsg = listEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    listEl.insertAdjacentHTML('afterbegin', logRow(merged));
    logs.unshift(merged);

    form.reset();
    form.elements.log_date.value = todayISO();
    warnDuplicate();
  });
}

async function loadList(listEl, onLoad) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var records;
  try {
    records = await getFactoryLogs();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!records || records.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No factory logs yet. Add the first one above.</p>';
  } else {
    listEl.innerHTML = records.map(logRow).join('');
  }
  if (onLoad) onLoad(records || []);
}

function summary(r) {
  return `
    <div class="rounded-lg bg-surface-alt p-4">
      <p class="text-sm font-medium text-ink-muted">Factory log saved</p>
      <div class="mt-2 flex flex-col gap-1">
        <p class="text-sm text-ink">Total out (distribution + in-house): <span class="font-semibold tabular-nums">${formatNumber(r.total_2)} bags</span></p>
        <p class="text-sm text-ink">Total accounted (out + closing stock): <span class="font-semibold tabular-nums">${formatNumber(r.total_1)} bags</span></p>
        <p class="text-sm text-ink">Production today: <span class="font-semibold tabular-nums">${formatNumber(r.production)} bags</span></p>
      </div>
    </div>`;
}

function logRow(r) {
  return listRow([
    { value: formatDate(r.log_date || r.date), className: 'text-ink' },
    { value: 'Prod ' + formatNumber(r.production), className: 'text-ink' },
    { value: 'Open ' + formatNumber(r.opening_stock), className: 'text-ink-muted' },
    { value: 'Close ' + formatNumber(r.closing_stock), className: 'text-ink-muted' },
  ]);
}