import { getWorkers, getWorker, createWorker, addSalaryRecord, updateSalaryRecord } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow, stackedRow } from '../components/list-row.js';
import { formatNaira, escapeHtml, formatDate, todayISO } from '../utils.js';
import { attachFormModal } from '../components/form-modal.js';

export async function render(container, params) {
  return params && params.id ? renderDetail(container, params.id) : renderList(container);
}

function configurePayArrangement(form) {
  const select = form.elements.salary_frequency;
  const salaryField = form.querySelector('[data-base-salary-field]');
  const salaryInput = form.elements.base_salary;
  const update = () => {
    const monthly = select.value === 'monthly';
    salaryField.hidden = !monthly;
    salaryInput.required = monthly;
    if (!monthly) salaryInput.value = '';
  };
  select.addEventListener('change', update);
  update();
}

function currentPayPeriod(frequency) {
  const today = new Date(`${todayISO()}T12:00:00Z`);
  if (frequency === 'monthly') return todayISO().slice(0, 7);
  if (frequency === 'daily') return todayISO();
  const day = today.getUTCDay() || 7;
  today.setUTCDate(today.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((today - yearStart) / 86400000) + 1) / 7);
  return `${today.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
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
      <label class="flex flex-col gap-1.5 text-sm font-medium text-ink">State of origin<select name="state_of_origin" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="">Select state</option>${['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'].map((state) => `<option>${state}</option>`).join('')}</select></label>
      <div class="flex flex-col gap-1.5"><label for="salary_frequency" class="text-sm font-medium text-ink">Pay arrangement</label><select id="salary_frequency" name="salary_frequency" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="monthly">Monthly salaried</option><option value="weekly">Weekly full-time · variable pay</option><option value="daily">Daily on-call · pay per workday</option></select></div>
      <div data-base-salary-field>${formField({ name: 'base_salary', label: 'Monthly salary', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}</div>
      ${formField({ name: 'start_date', label: 'Start date', type: 'date', value: todayISO() })}
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save worker</button>
    </form>

    <div id="worker-msg" class="mt-4"></div>
    <div id="worker-list" class="mt-3"></div>`;

  var btn = container.querySelector('#add-worker-btn');
  var form = container.querySelector('#worker-form');
  var msgEl = container.querySelector('#worker-msg');
  var listEl = container.querySelector('#worker-list');
  const workerModal = attachFormModal(container, form, btn, 'Add worker');
  configurePayArrangement(form);

  function toggleForm() {
    var hidden = form.classList.contains('hidden');
    form.classList.toggle('hidden', !hidden);
    form.classList.toggle('flex', hidden);
    btn.setAttribute('aria-expanded', hidden ? 'true' : 'false');
    if (hidden) form.elements.name.focus();
  }

  loadList(listEl);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      name: String(fd.get('name') || '').trim(),
      role: String(fd.get('role') || '').trim() || null,
      base_salary: fd.get('base_salary') === '' ? null : Number(fd.get('base_salary')),
      state_of_origin: String(fd.get('state_of_origin') || '').trim() || null,
      start_date: fd.get('start_date'),
      salary_frequency: fd.get('salary_frequency'),
    };

    try {
      await createWorker(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    msgEl.innerHTML = '<p class="rounded-lg border border-positive bg-surface p-4 text-positive">Worker added.</p>';
    form.reset();
    workerModal.close();
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
    { value: w.salary_frequency === 'monthly' ? formatNaira(w.base_salary) : w.salary_frequency === 'weekly' ? 'Weekly variable pay' : 'Daily on-call', className: 'text-ink' },
    { value: w.next_pay_label || '', className: 'text-ink-muted' },
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
    <p class="mt-1 text-sm text-ink-muted">${escapeHtml(worker.role) || '—'} · ${escapeHtml(worker.state_of_origin || 'State not set')} · ${worker.salary_frequency === 'monthly' ? `Monthly salary <span class="tabular-nums">${formatNaira(worker.base_salary)}</span>` : worker.salary_frequency === 'weekly' ? 'Weekly full-time · variable pay' : 'Daily on-call · paid per workday'} · ${escapeHtml(worker.next_pay_label || 'Schedule not set')}</p>
    <p class="mt-1 text-sm text-ink-muted">Started ${escapeHtml(worker.start_date || '')}</p>

    <button type="button" id="new-salary-record" class="mt-6 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ New salary record</button>
    <form id="record-form" class="mt-3 flex flex-col gap-4">
      ${formField({ name: 'pay_period', label: worker.salary_frequency === 'daily' ? 'Work date' : 'Pay period', placeholder: worker.salary_frequency === 'monthly' ? 'e.g. 2026-09' : worker.salary_frequency === 'weekly' ? 'e.g. 2026-W43' : 'e.g. 2026-10-22', value: currentPayPeriod(worker.salary_frequency) })}
      ${formField({ name: 'due_date', label: 'Salary due date', type: 'date', value: todayISO() })}
      ${formField({ name: 'salary_due', label: worker.salary_frequency === 'monthly' ? 'Monthly salary due' : 'Amount earned this period', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: worker.salary_frequency === 'monthly' ? worker.base_salary : '' })}
      ${formField({ name: 'advance', label: 'Advance taken', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      ${formField({ name: 'amount_paid', label: 'Amount paid', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      <div id="record-feedback" class="empty:hidden" role="alert" aria-live="assertive"></div>
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save salary record</button>
    </form>
    <div id="record-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">History</h2>
    <div id="record-list" class="mt-3"></div>`;

  var form = container.querySelector('#record-form');
  var summaryEl = container.querySelector('#record-summary');
  var feedbackEl = container.querySelector('#record-feedback');
  var listEl = container.querySelector('#record-list');
  const recordModal = attachFormModal(container, form, container.querySelector('#new-salary-record'), 'Add salary record');
  let editingRecord = null;
  const newRecordButton = container.querySelector('#new-salary-record');
  newRecordButton.addEventListener('click', () => {
    feedbackEl.innerHTML = '';
    editingRecord = null;
    form.reset();
    form.elements.salary_due.value = worker.salary_frequency === 'monthly' ? worker.base_salary : '';
    form.elements.pay_period.value = currentPayPeriod(worker.salary_frequency);
    form.elements.due_date.value = todayISO();
    form.elements.advance.value = '0';
    form.elements.amount_paid.value = '0';
    form.querySelector('button[type="submit"]').textContent = 'Save salary record';
  });

  if (records.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No salary records yet.</p>';
  } else {
    listEl.innerHTML = records.map(recordRow).join('');
  }

  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit-salary-record]');
    if (!button) return;
    editingRecord = records.find((record) => Number(record.id) === Number(button.dataset.editSalaryRecord));
    if (!editingRecord) return;
    feedbackEl.innerHTML = '';
    form.elements.pay_period.value = editingRecord.pay_period;
    form.elements.due_date.value = editingRecord.due_date || todayISO();
    form.elements.salary_due.value = editingRecord.salary_due;
    form.elements.advance.value = editingRecord.advance;
    form.elements.amount_paid.value = editingRecord.amount_paid;
    form.querySelector('button[type="submit"]').textContent = 'Update salary record';
    recordModal.open();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    feedbackEl.innerHTML = '';
    const readNumber = (name) => {
      const raw = fd.get(name);
      if (raw === null || raw === '') return 0;
      const value = Number(raw);
      return Number.isFinite(value) ? value : NaN;
    };
    var body = {
      pay_period: String(fd.get('pay_period') || '').trim(),
      due_date: fd.get('due_date'),
      salary_due: readNumber('salary_due'),
      advance: readNumber('advance'),
      amount_paid: readNumber('amount_paid'),
    };

    var result;
    try {
      result = editingRecord
        ? await updateSalaryRecord(id, editingRecord.id, body)
        : await addSalaryRecord(id, body);
    } catch (err) {
      feedbackEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">Could not save this salary record: ' + escapeHtml(err.message) + '</p>';
      feedbackEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    var merged = Object.assign({}, body, result);
    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Salary record ${editingRecord ? 'updated' : 'saved'}</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-debt' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var emptyMsg = listEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    if (editingRecord) {
      const oldRow = listEl.querySelector(`[data-salary-record="${editingRecord.id}"]`);
      if (oldRow) oldRow.outerHTML = recordRow(merged);
      records = records.map((record) => Number(record.id) === Number(result.id) ? merged : record);
    } else {
      listEl.insertAdjacentHTML('afterbegin', recordRow(merged));
      records.unshift(merged);
    }
    editingRecord = null;
    form.querySelector('button[type="submit"]').textContent = 'Save salary record';
    recordModal.close();

    form.reset();
    form.elements.salary_due.value = worker.salary_frequency === 'monthly' ? worker.base_salary : '';
    form.elements.advance.value = '0';
    form.elements.amount_paid.value = '0';
  });
}

function recordRow(r) {
  var bal = r.balance > 0 ? 'text-debt' : 'text-ink-muted';
  const overdue = Number(r.balance) > 0 && r.due_date && r.due_date < todayISO();
  return `<article data-salary-record="${r.id}" class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
    <div><p class="text-sm font-medium text-ink">${escapeHtml(r.pay_period)}${r.due_date ? ' · Due ' + formatDate(r.due_date) : ''}</p>
    <p class="mt-0.5 text-xs text-ink-muted">Salary ${formatNaira(r.salary_due)} · Advance ${formatNaira(r.advance)} · Paid ${formatNaira(r.amount_paid)}</p>
    <p class="mt-0.5 text-sm ${overdue ? 'font-semibold text-debt' : bal}">${overdue ? 'Overdue ' : 'Balance '}${formatNaira(r.balance)}</p></div>
    <button type="button" data-edit-salary-record="${r.id}" class="min-h-11 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary">Edit</button>
  </article>`;
}
