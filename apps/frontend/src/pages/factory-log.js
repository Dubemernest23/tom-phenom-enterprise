import { getFactoryLogs, createFactoryLog, updateFactoryLog } from '../api.js';
import { formField } from '../components/form-field.js';
import { formatNumber, formatDate, todayISO, escapeHtml } from '../utils.js';
import { attachFormModal } from '../components/form-modal.js';

function dateOf(record) { return record.log_date || record.date; }

export async function render(container) {
  container.innerHTML = `
    <div class="flex items-center justify-between gap-3"><h1 class="font-heading text-xl font-semibold text-ink">Daily factory log</h1><button type="button" id="new-log" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ New log</button></div>
    <div id="log-warning" class="mt-4" aria-live="polite"></div>
    <form id="log-form" class="mt-4 flex flex-col gap-4">
      ${formField({ name: 'log_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'opening_stock', label: 'Opening stock', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'closing_stock', label: 'Closing stock', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'distribution_qty', label: 'Distribution quantity', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'in_house_qty', label: 'In-house quantity', type: 'number', inputmode: 'numeric', min: 0 })}
      <button data-submit class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save factory log</button>
      <button type="button" data-cancel class="hidden min-h-11 w-full rounded-lg border border-line px-4 py-3 text-base font-medium text-ink">Cancel edit</button>
    </form>
    <div id="log-summary" class="mt-4" aria-live="polite"></div>
    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">Past logs</h2>
    <div id="log-list" class="mt-3"></div>`;

  const form = container.querySelector('#log-form');
  const warningEl = container.querySelector('#log-warning');
  const summaryEl = container.querySelector('#log-summary');
  const listEl = container.querySelector('#log-list');
  const submitButton = form.querySelector('[data-submit]');
  const cancelButton = form.querySelector('[data-cancel]');
  const logModal = attachFormModal(container, form, container.querySelector('#new-log'), 'Factory log');
  container.querySelector('#new-log').addEventListener('click', resetForm);
  let logs = [];
  let editingId = null;

  function matchingLog(date) {
    return logs.find((record) => dateOf(record) === date && Number(record.id) !== Number(editingId));
  }

  function checkDuplicate() {
    const duplicate = matchingLog(form.elements.log_date.value);
    warningEl.innerHTML = duplicate
      ? `<p class="rounded-lg border border-warning bg-surface p-3 text-sm text-warning">A factory log already exists for ${formatDate(dateOf(duplicate))}. Each day can have one log. Edit the existing entry to correct it.</p>`
      : '';
    return duplicate;
  }

  async function reloadList() {
    listEl.innerHTML = '<p class="py-2 text-ink-muted">Loading...</p>';
    try {
      logs = await getFactoryLogs() || [];
      renderLogs();
      checkDuplicate();
    } catch (err) {
      listEl.innerHTML = `<p class="py-2 text-debt">${escapeHtml(err.message)}</p>`;
    }
  }

  function renderLogs() {
    listEl.innerHTML = logs.length
      ? logs.map(logRow).join('')
      : '<p data-empty class="py-2 text-ink-muted">No factory logs yet. Add the first one above.</p>';
  }

  function resetForm() {
    editingId = null;
    form.reset();
    form.elements.log_date.value = todayISO();
    submitButton.textContent = 'Save factory log';
    cancelButton.classList.add('hidden');
    checkDuplicate();
  }

  function startEdit(id) {
    const record = logs.find((item) => Number(item.id) === Number(id));
    if (!record) return;
    editingId = record.id;
    form.elements.log_date.value = dateOf(record);
    form.elements.opening_stock.value = record.opening_stock;
    form.elements.closing_stock.value = record.closing_stock;
    form.elements.distribution_qty.value = record.distribution_qty;
    form.elements.in_house_qty.value = record.in_house_qty;
    submitButton.textContent = 'Update factory log';
    cancelButton.classList.remove('hidden');
    summaryEl.innerHTML = '';
    checkDuplicate();
    form.elements.opening_stock.focus();
    logModal.open();
  }

  function inputBody() {
    const fd = new FormData(form);
    return {
      log_date: fd.get('log_date'),
      opening_stock: Number(fd.get('opening_stock')),
      closing_stock: Number(fd.get('closing_stock')),
      distribution_qty: Number(fd.get('distribution_qty')),
      in_house_qty: Number(fd.get('in_house_qty')),
    };
  }

  form.elements.log_date.addEventListener('change', checkDuplicate);
  cancelButton.addEventListener('click', () => { resetForm(); logModal.close(); });
  listEl.addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit-log]');
    if (button) startEdit(button.dataset.editLog);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (checkDuplicate()) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-warning bg-surface p-4 text-warning">This date already has a factory log. Choose Edit on that entry to correct it.</p>';
      return;
    }

    const body = inputBody();
    let result;
    try {
      result = editingId
        ? await updateFactoryLog(editingId, body)
        : await createFactoryLog(body);
    } catch (err) {
      summaryEl.innerHTML = `<p class="rounded-lg border border-debt bg-surface p-4 text-debt">${escapeHtml(err.message)}</p>`;
      return;
    }

    summaryEl.innerHTML = summary(result, editingId ? 'Factory log updated' : 'Factory log saved');
    resetForm();
    logModal.close();
    await reloadList();
  });

  await reloadList();
}

function summary(record, title) {
  return `
    <div class="rounded-lg bg-surface-alt p-4">
      <p class="text-sm font-medium text-ink-muted">${title}</p>
      <div class="mt-2 flex flex-col gap-1">
        <p class="text-sm text-ink">Total out (distribution + in-house): <span class="font-semibold tabular-nums">${formatNumber(record.total_2)} bags</span></p>
        <p class="text-sm text-ink">Total accounted (out + closing stock): <span class="font-semibold tabular-nums">${formatNumber(record.total_1)} bags</span></p>
        <p class="text-sm text-ink">Production today: <span class="font-semibold tabular-nums">${formatNumber(record.production)} bags</span></p>
      </div>
    </div>`;
}

function logRow(record) {
  return `
    <div class="border-b border-line px-4 py-3" data-log-id="${record.id}">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span class="min-w-0 flex-1 text-sm tabular-nums text-ink">${formatDate(dateOf(record))}</span>
        <span class="text-sm tabular-nums text-ink">Prod ${formatNumber(record.production)}</span>
        <span class="text-sm tabular-nums text-ink-muted">Distribution ${formatNumber(record.distribution_qty)}</span>
        <span class="text-sm tabular-nums text-ink-muted">In-house ${formatNumber(record.in_house_qty)}</span>
        <span class="text-sm tabular-nums text-ink-muted">Total out ${formatNumber(record.total_2 ?? (Number(record.distribution_qty) + Number(record.in_house_qty)))}</span>
        <span class="text-sm tabular-nums text-ink-muted">Open ${formatNumber(record.opening_stock)}</span>
        <span class="text-sm tabular-nums text-ink-muted">Close ${formatNumber(record.closing_stock)}</span>
        <button type="button" data-edit-log="${record.id}" aria-label="Edit factory log for ${formatDate(dateOf(record))}" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">Edit</button>
      </div>
    </div>`;
}
