import { getDistributions, createDistribution } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNaira, formatNumber, formatDate, todayISO } from '../utils.js';

export async function render(container) {
  container.innerHTML = `
    <h1 class="font-heading text-xl font-semibold text-ink">Distribution</h1>

    <form id="dist-form" class="mt-6 flex flex-col gap-4">
      ${formField({ name: 'dist_date', label: 'Date', type: 'date', value: todayISO() })}

      <div>
        <p class="text-sm font-medium text-ink">Channel</p>
        ${segment(2, [
          { value: 'keke', label: 'Keke' },
          { value: 'van', label: 'Van' },
        ], 'keke', 'distribution channel')}
      </div>

      ${formField({ name: 'quantity_given', label: 'Quantity given', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'price_per_bag', label: 'Price per bag', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'amount_returned', label: 'Amount returned', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save distribution</button>
    </form>

    <div id="dist-summary" class="mt-4"></div>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-heading text-lg font-semibold text-ink">Records</h2>
      ${segment(3, [
        { value: 'all', label: 'All' },
        { value: 'keke', label: 'Keke' },
        { value: 'van', label: 'Van' },
      ], 'all', 'filter by channel')}
    </div>
    <div id="dist-list" class="mt-3"></div>`;

  var form = container.querySelector('#dist-form');
  var summaryEl = container.querySelector('#dist-summary');
  var listEl = container.querySelector('#dist-list');
  var channel = 'keke';
  var filter = 'all';

  wireSegment(container, 'distribution channel', function (value) {
    channel = value;
  });

  wireSegment(container, 'filter by channel', function (value) {
    filter = value;
    loadList(listEl, filter);
  });

  loadList(listEl, filter);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      dist_date: fd.get('dist_date'),
      channel: channel,
      quantity_given: Number(fd.get('quantity_given')),
      price_per_bag: Number(fd.get('price_per_bag')),
      amount_returned: Number(fd.get('amount_returned')),
    };

    var result;
    try {
      result = await createDistribution(body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Distribution saved</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Amount expected: <span class="font-semibold tabular-nums">${formatNaira(result.amount_expected)}</span></p>
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-warning' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var merged = Object.assign({}, body, result);
    if (filter === 'all' || filter === channel) {
      var emptyMsg = listEl.querySelector('[data-empty]');
      if (emptyMsg) emptyMsg.remove();
      listEl.insertAdjacentHTML('afterbegin', distRow(merged));
    }

    form.reset();
    form.elements.dist_date.value = todayISO();
    form.elements.amount_returned.value = '0';
  });
}

function segment(cols, items, value, name) {
  return `
    <div class="mt-1.5 grid gap-1 rounded-lg border border-line bg-surface p-1" role="group" aria-label="${name}"
      style="grid-template-columns: repeat(${cols}, minmax(0, 1fr))">
      ${items.map(function (it) {
        return `<button type="button" data-seg-value="${it.value}"
          aria-pressed="${it.value === value ? 'true' : 'false'}"
          class="min-h-11 rounded-md px-3 text-sm font-medium ${it.value === value ? 'bg-primary text-surface' : 'text-ink-muted hover:bg-surface-alt'}">
          ${it.label}</button>`;
      }).join('')}
    </div>`;
}

function wireSegment(container, name, onChange) {
  container.querySelector('[role="group"][aria-label="' + name + '"]').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-seg-value]');
    if (!btn) return;
    var value = btn.dataset.segValue;
    btn.parentElement.querySelectorAll('[data-seg-value]').forEach(function (b) {
      var active = b === btn;
      b.classList.toggle('bg-primary', active);
      b.classList.toggle('text-surface', active);
      b.classList.toggle('text-ink-muted', !active);
      b.classList.toggle('hover:bg-surface-alt', !active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    onChange(value);
  });
}

async function loadList(listEl, filter) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var records;
  try {
    records = await getDistributions(filter);
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!records || records.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No distribution records yet. Add the first entry above.</p>';
    return;
  }
  listEl.innerHTML = records.map(distRow).join('');
}

function channelTag(ch) {
  var label = ch === 'keke' ? 'Keke' : 'Van';
  return '<span class="rounded border border-line bg-surface-alt px-2 py-0.5 text-xs font-medium text-ink">' + label + '</span>';
}

function distRow(r) {
  var bal = formatNaira(r.balance);
  if (r.balance > 0) bal = 'Owed ' + bal;
  return listRow([
    { value: formatDate(r.dist_date || r.date), className: 'text-ink' },
    { value: channelTag(r.channel) },
    { value: formatNumber(r.quantity_given) + ' bags', className: 'text-ink' },
    { value: bal, className: r.balance > 0 ? 'font-semibold text-warning' : 'text-ink-muted' },
  ]);
}