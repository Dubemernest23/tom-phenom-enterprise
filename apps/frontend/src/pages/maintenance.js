import { getMaintenanceRecords, createMaintenanceRecord } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNaira, formatDate, todayISO, escapeHtml } from '../utils.js';

export async function render(container) {
  container.innerHTML = `
    <h1 class="font-heading text-xl font-semibold text-ink">Maintenance</h1>

    <form id="maintenance-form" class="mt-6 flex flex-col gap-4">
      ${formField({ name: 'maint_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'equipment', label: 'Equipment' })}
      ${formField({ name: 'description', label: 'Description', required: false })}
      ${formField({ name: 'cost', label: 'Cost', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'vendor', label: 'Vendor (optional)', required: false })}
      <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save maintenance record</button>
    </form>

    <div id="maintenance-msg" class="mt-4"></div>

    <div id="month-total" class="mt-8"></div>

    <h2 class="mt-6 font-heading text-lg font-semibold text-ink">Records</h2>
    <div id="maintenance-list" class="mt-3"></div>`;

  var form = container.querySelector('#maintenance-form');
  var msgEl = container.querySelector('#maintenance-msg');
  var totalEl = container.querySelector('#month-total');
  var listEl = container.querySelector('#maintenance-list');

  var total = 0;

  function renderTotal() {
    totalEl.innerHTML = totalBlock(total);
  }

  loadList(listEl, function (records) {
    total = monthTotal(records);
    renderTotal();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      maint_date: fd.get('maint_date'),
      equipment: String(fd.get('equipment') || '').trim(),
      description: String(fd.get('description') || '').trim() || null,
      cost: Number(fd.get('cost')),
      vendor: String(fd.get('vendor') || '').trim() || null,
    };

    var result;
    try {
      result = await createMaintenanceRecord(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    msgEl.innerHTML = '<p class="rounded-lg border border-positive bg-surface p-4 text-positive">Maintenance record saved.</p>';

    var merged = Object.assign({}, body, result);
    var emptyMsg = listEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    listEl.insertAdjacentHTML('afterbegin', maintRow(merged));

    total = total + Number(result.cost || body.cost || 0);
    renderTotal();

    form.reset();
    form.elements.maint_date.value = todayISO();
  });
}

async function loadList(listEl, onLoad) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var records;
  try {
    records = await getMaintenanceRecords();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!records || records.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No maintenance records yet. Add the first one above.</p>';
  } else {
    listEl.innerHTML = records.map(maintRow).join('');
  }
  if (onLoad) onLoad(records || []);
}

function monthTotal(records) {
  var now = new Date();
  var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  return records.reduce(function (sum, r) {
    var d = String(r.maint_date || r.date || '');
    return d.slice(0, 7) === ym ? sum + Number(r.cost || 0) : sum;
  }, 0);
}

function totalBlock(total) {
  return `
    <div class="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-surface-alt p-4">
      <p class="text-sm font-medium text-ink-muted">This month's maintenance total</p>
      <p class="font-heading text-2xl font-bold tabular-nums text-ink">${formatNaira(total)}</p>
    </div>`;
}

function maintRow(r) {
  var detail = r.description || r.vendor || '—';
  return listRow([
    { value: formatDate(r.maint_date || r.date), className: 'text-ink' },
    { value: escapeHtml(r.equipment), className: 'text-ink' },
    { value: escapeHtml(detail), className: 'text-ink-muted' },
    { value: formatNaira(r.cost), className: 'text-ink' },
  ]);
}