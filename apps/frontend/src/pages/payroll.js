import { getWorkers, getWorker, createWorker, addSalaryRecord } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow, stackedRow } from '../components/list-row.js';
import { formatNaira, escapeHtml } from '../utils.js';

export async function render(container, params) {
  return params && params.id ? renderDetail(container, params.id) : renderList(container);
}

// ---------- List view (#/payroll) ----------

async function renderList(container) {
  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-heading text-xl font-semibold text-ink">Payroll</h1>
      <button type="button" id="add-worker-btn" aria-expanded="false" aria-controls="worker-form" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-surface">+ Add worker</button>
    </div>

    <form id="worker-form" class="mt-4 hidden flex-col gap-4">
      ${formField({ name: 'name', label: 'Name' })}
      ${formField({ name: 'role', label: 'Role', required: false })}
      ${formField({ name: 'base_salary', label: 'Base salary', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save worker</button>
    </form>

    <div id="worker-msg" class="mt-4"></div>
    <div id="worker-list" class="mt-3"></div>`;

  var btn = container.querySelector('#add-worker-btn');
  var form = container.querySelector('#worker-form');
  var msgEl = container.querySelector('#worker-msg');
  var listEl = container.querySelector('#worker-list');

  function toggleForm() {
    var hidden = form.classList.contains('hidden');
    form.classList.toggle('hidden', !hidden);
    form.classList.toggle('flex', hidden);
    btn.setAttribute('aria-expanded', hidden ? 'true' : 'false');
    if (hidden) form.elements.name.focus();
  }

  btn.addEventListener('click', toggleForm);

  loadList(listEl);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      name: String(fd.get('name') || '').trim(),
      role: String(fd.get('role') || '').trim() || null,
      base_salary: Number(fd.get('base_salary')),
    };

    try {
      await createWorker(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    msgEl.innerHTML = '<p class="rounded-lg border border-positive bg-surface p-4 text-positive">Worker added.</p>';
    form.reset();
    toggleForm();
    loadList(listEl);
  });
}

async function loadList(listEl) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var workers;
  try {
    workers = await getWorkers();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!workers || workers.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No workers yet. Add the first one above.</p>';
    return;
  }
  listEl.innerHTML = workers.map(workerRow).join('');
}

function workerRow(w) {
  return listRow([
    { value: escapeHtml(w.name), className: 'text-ink' },
    { value: escapeHtml(w.role) || '—', className: 'text-ink-muted' },
    { value: formatNaira(w.base_salary), className: 'text-ink' },
  ], { href: '#/payroll/' + w.id });
}

// ---------- Detail view (#/payroll/:id) ----------

async function renderDetail(container, id) {
  container.innerHTML = '<p class="text-ink-muted py-4">Loading worker...</p>';
  var worker;
  try {
    worker = await getWorker(id);
  } catch (err) {
    container.innerHTML = '<p class="text-debt py-4">Failed to load worker: ' + err.message + '</p>';
    return;
  }

  var records = worker.records || [];

  container.innerHTML = `
    <p class="text-sm text-ink-muted"><a href="#/payroll" class="text-primary">Payroll</a> / ${escapeHtml(worker.name)}</p>
    <h1 class="mt-1 font-heading text-xl font-semibold text-ink">${escapeHtml(worker.name)}</h1>
    <p class="mt-1 text-sm text-ink-muted">${escapeHtml(worker.role) || '—'} · Base salary <span class="tabular-nums">${formatNaira(worker.base_salary)}</span></p>

    <h2 class="mt-6 font-heading text-lg font-semibold text-ink">New salary record</h2>
    <form id="record-form" class="mt-3 flex flex-col gap-4">
      ${formField({ name: 'pay_period', label: 'Pay period', placeholder: 'e.g. 2026-09' })}
      ${formField({ name: 'salary_due', label: 'Salary due', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: worker.base_salary })}
      ${formField({ name: 'advance', label: 'Advance taken', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      ${formField({ name: 'amount_paid', label: 'Amount paid', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save salary record</button>
    </form>
    <div id="record-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">History</h2>
    <div id="record-list" class="mt-3"></div>`;

  var form = container.querySelector('#record-form');
  var summaryEl = container.querySelector('#record-summary');
  var listEl = container.querySelector('#record-list');

  if (records.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No salary records yet.</p>';
  } else {
    listEl.innerHTML = records.map(recordRow).join('');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      pay_period: String(fd.get('pay_period') || '').trim(),
      salary_due: Number(fd.get('salary_due')),
      advance: Number(fd.get('advance')),
      amount_paid: Number(fd.get('amount_paid')),
    };

    var result;
    try {
      result = await addSalaryRecord(id, body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    var merged = Object.assign({}, body, result);
    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Salary record saved</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-debt' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var emptyMsg = listEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    listEl.insertAdjacentHTML('afterbegin', recordRow(merged));

    form.reset();
    form.elements.salary_due.value = worker.base_salary;
    form.elements.advance.value = '0';
    form.elements.amount_paid.value = '0';
  });
}

function recordRow(r) {
  var bal = r.balance > 0 ? 'text-debt' : 'text-ink-muted';
  return stackedRow({
    primary: escapeHtml(r.pay_period),
    secondary: 'Due ' + formatNaira(r.salary_due) + ' · Advance ' + formatNaira(r.advance) + ' · Paid ' + formatNaira(r.amount_paid),
    value: 'Balance ' + formatNaira(r.balance),
    valueClass: bal,
  });
}