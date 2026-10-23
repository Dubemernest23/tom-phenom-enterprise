import {
  getDistributions, getDistribution, createDistribution, updateDistribution,
  addDistributionTransfer, calculateDistribution,
} from '../api.js';
import { formField } from '../components/form-field.js';
import { formatNaira, formatNumber, formatDate, todayISO, escapeHtml } from '../utils.js';
import { attachFormModal } from '../components/form-modal.js';

export async function render(container) {
  container.innerHTML = `
    <div class="flex items-center justify-between gap-3"><h1 class="font-heading text-xl font-semibold text-ink">Distribution</h1><button type="button" id="new-dist" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ New record</button></div>
    <form id="dist-form" class="mt-6 flex flex-col gap-4">
      ${formField({ name: 'dist_date', label: 'Date', type: 'date', value: todayISO() })}
      <div><p class="text-sm font-medium text-ink">Channel</p>
        ${segment(2, [{ value: 'keke', label: 'Keke' }, { value: 'van', label: 'Van' }], 'keke', 'distribution channel')}
      </div>
      ${formField({ name: 'recipient_name', label: 'Keke driver name', placeholder: 'Name' })}
      ${formField({ name: 'quantity_given', label: 'Quantity given', type: 'number', inputmode: 'numeric', min: 1 })}
      ${formField({ name: 'price_per_bag', label: 'Price per bag', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'amount_returned', label: 'Cash received', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      <button data-save class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save distribution</button>
      <button type="button" data-cancel class="hidden min-h-11 w-full rounded-lg border border-line px-4 py-3 text-base font-medium text-ink">Cancel edit</button>
    </form>
    <div id="dist-summary" class="mt-4" aria-live="polite"></div>
    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-heading text-lg font-semibold text-ink">Records</h2>
      ${segment(3, [{ value: 'all', label: 'All' }, { value: 'keke', label: 'Keke' }, { value: 'van', label: 'Van' }], 'all', 'filter by channel')}
    </div>
    <div id="dist-list" class="mt-3"></div>`;

  const form = container.querySelector('#dist-form');
  const summaryEl = container.querySelector('#dist-summary');
  const listEl = container.querySelector('#dist-list');
  const saveButton = form.querySelector('[data-save]');
  const cancelButton = form.querySelector('[data-cancel]');
  const distributionModal = attachFormModal(container, form, container.querySelector('#new-dist'), 'New distribution');
  container.querySelector('#new-dist').addEventListener('click', resetForm);
  let channel = 'keke';
  let filter = 'all';
  let editingId = null;

  function syncNameLabel() {
    form.querySelector('label[for="recipient_name"]').textContent = `${channel === 'keke' ? 'Keke' : 'Van'} driver name`;
  }

  function resetForm() {
    editingId = null;
    form.reset();
    channel = 'keke';
    const kekeButton = container.querySelector('[aria-label="distribution channel"] [data-seg-value="keke"]');
    if (kekeButton) kekeButton.click();
    form.elements.dist_date.value = todayISO();
    form.elements.amount_returned.value = '0';
    saveButton.textContent = 'Save distribution';
    cancelButton.classList.add('hidden');
    syncNameLabel();
  }

  function beginEdit(record) {
    summaryEl.innerHTML = '';
    editingId = record.id;
    channel = record.channel;
    const selected = container.querySelector(`[aria-label="distribution channel"] [data-seg-value="${record.channel}"]`);
    if (selected) selected.click();
    form.elements.dist_date.value = record.dist_date;
    form.elements.recipient_name.value = record.recipient_name || '';
    form.elements.quantity_given.value = record.quantity_given;
    form.elements.price_per_bag.value = record.price_per_bag;
    form.elements.amount_returned.value = record.amount_returned;
    saveButton.textContent = 'Update distribution';
    cancelButton.classList.remove('hidden');
    syncNameLabel();
    form.elements.recipient_name.focus();
    distributionModal.open();
  }

  function formBody() {
    const fd = new FormData(form);
    return {
      dist_date: fd.get('dist_date'),
      channel,
      recipient_name: String(fd.get('recipient_name') || '').trim(),
      quantity_given: Number(fd.get('quantity_given')),
      price_per_bag: Number(fd.get('price_per_bag')),
      amount_returned: Number(fd.get('amount_returned')),
    };
  }

  async function showDetails(row, panel) {
    row.querySelectorAll('[data-form-modal]').forEach((modal) => modal.remove());
    panel.classList.remove('hidden');
    panel.innerHTML = '<p class="py-2 text-sm text-ink-muted">Loading details...</p>';
    try {
      const record = await getDistribution(row.dataset.distId);
      panel.dataset.loaded = 'true';
      panel.dataset.record = JSON.stringify(record);
      panel.innerHTML = detailMarkup(record);
      const transferForm = panel.querySelector('[data-transfer-form]');
      attachFormModal(row, transferForm, panel.querySelector('[data-new-transfer]'), 'Record transfer received');
      transferForm.dataset.modalAttached = 'true';
      const balance = Number(record.balance);
      const balanceLabel = balance > 0 ? `Owed ${formatNaira(balance)}` : balance < 0 ? `Credit ${formatNaira(Math.abs(balance))}` : 'Settled';
      row.querySelector('[data-row-balance]').textContent = balanceLabel;
      row.querySelector('[data-row-balance]').className = `text-sm tabular-nums ${balance > 0 ? 'font-semibold text-warning' : 'text-ink-muted'}`;
    } catch (err) {
      panel.innerHTML = `<p class="py-2 text-sm text-debt">${escapeHtml(err.message)}</p>`;
      panel.dataset.loaded = 'false';
    }
  }

  wireSegment(container, 'distribution channel', (value) => { channel = value; syncNameLabel(); });
  wireSegment(container, 'filter by channel', (value) => { filter = value; loadList(listEl, filter); });
  syncNameLabel();
  await loadList(listEl, filter);

  listEl.addEventListener('click', async (event) => {
    const editButton = event.target.closest('[data-edit-distribution]');
    if (editButton) {
      const row = editButton.closest('[data-dist-id]');
      const panel = row.querySelector('[data-dist-detail]');
      let record = panel.dataset.record && JSON.parse(panel.dataset.record);
      if (!record) record = await getDistribution(row.dataset.distId);
      beginEdit(record);
      return;
    }

    const calculateButton = event.target.closest('[data-calculate-distribution]');
    if (calculateButton) {
      const row = calculateButton.closest('[data-dist-id]');
      const panel = row.querySelector('[data-dist-detail]');
      calculateButton.disabled = true;
      try {
        await calculateDistribution(row.dataset.distId);
        await showDetails(row, panel, true);
      } catch (err) {
        panel.insertAdjacentHTML('afterbegin', `<p class="text-sm text-debt">${escapeHtml(err.message)}</p>`);
      } finally {
        calculateButton.disabled = false;
      }
      return;
    }

    const detailsButton = event.target.closest('[data-dist-details]');
    if (!detailsButton) return;
    const row = detailsButton.closest('[data-dist-id]');
    const panel = row.querySelector('[data-dist-detail]');
    if (!panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
      detailsButton.textContent = 'Details';
    } else {
      detailsButton.textContent = 'Hide details';
      if (panel.dataset.loaded !== 'true') await showDetails(row, panel);
      else panel.classList.remove('hidden');
    }
  });

  listEl.addEventListener('submit', async (event) => {
    const transferForm = event.target.closest('[data-transfer-form]');
    if (!transferForm) return;
    event.preventDefault();
    const row = transferForm.closest('[data-dist-id]');
    const fd = new FormData(transferForm);
    const button = transferForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await addDistributionTransfer(row.dataset.distId, {
        transfer_date: fd.get('transfer_date'),
        amount: Number(fd.get('amount')),
        note: String(fd.get('note') || '').trim() || null,
      });
      await showDetails(row, row.querySelector('[data-dist-detail]'));
    } catch (err) {
      transferForm.querySelector('[data-transfer-message]').innerHTML = `<p class="text-sm text-debt">${escapeHtml(err.message)}</p>`;
    } finally {
      button.disabled = false;
    }
  });

  cancelButton.addEventListener('click', () => { resetForm(); distributionModal.close(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = formBody();
    const savedId = editingId;
    try {
      const result = savedId
        ? await updateDistribution(savedId, body)
        : await createDistribution(body);
      summaryEl.innerHTML = `<div class="rounded-lg bg-surface-alt p-4"><p class="text-sm font-medium text-ink-muted">Distribution ${savedId ? 'updated' : 'saved'}</p><p class="mt-2 text-sm text-ink">Amount expected: <span class="font-semibold tabular-nums">${formatNaira(result.amount_expected)}</span></p></div>`;
      resetForm();
      distributionModal.close();
      await loadList(listEl, filter);
    } catch (err) {
      summaryEl.innerHTML = `<p class="rounded-lg border border-debt bg-surface p-4 text-debt">${escapeHtml(err.message)}</p>`;
    }
  });
}

function detailMarkup(record) {
  const transfers = record.transfers || [];
  const current = record.balance_is_current;
  const balance = Number(current ? record.balance : record.calculated_balance);
  const balanceText = balance > 0 ? `Driver owes ${formatNaira(balance)}` : balance < 0 ? `Credit ${formatNaira(Math.abs(balance))}` : 'Settled';
  return `
    <div class="border-t border-line py-3">
      <div class="grid gap-2 text-sm sm:grid-cols-2">
        <p class="text-ink-muted">Driver: <span class="text-ink">${escapeHtml(record.recipient_name || 'Name not recorded')}</span></p>
        <p class="text-ink-muted">Channel: <span class="text-ink">${record.channel === 'keke' ? 'Keke' : 'Van'}</span></p>
        <p class="text-ink-muted">Price per bag: <span class="text-ink">${formatNaira(record.price_per_bag)}</span></p>
        <p class="text-ink-muted">Bags given: <span class="text-ink">${formatNumber(record.quantity_given)}</span></p>
        <p class="text-ink-muted">Amount expected: <span class="text-ink">${formatNaira(record.amount_expected)}</span></p>
        <p class="text-ink-muted">Cash received: <span class="text-ink">${formatNaira(record.amount_returned)}</span></p>
        <p class="text-ink-muted">Transfers received: <span class="text-ink">${formatNaira(record.total_transfers)}</span></p>
        <p class="text-ink-muted">${current ? 'Calculated balance' : 'Balance to calculate'}: <span class="font-semibold text-ink">${balanceText}</span></p>
      </div>
      ${!current ? '<p class="mt-2 text-sm text-warning">New cash or transfers have been recorded. Calculate the balance to update the account.</p>' : ''}
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" data-edit-distribution class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">Edit record</button>
        <button type="button" data-calculate-distribution class="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">Calculate balance</button>
      </div>
      <h3 class="mt-5 text-sm font-semibold text-ink">Transfers received</h3>
      ${transfers.length ? transfers.map((item) => `
        <div class="flex justify-between gap-3 border-b border-line py-2 text-sm">
          <span class="text-ink-muted">${formatDate(item.transfer_date)}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</span>
          <span class="font-medium tabular-nums text-ink">${formatNaira(item.amount)}</span>
        </div>`).join('') : '<p class="py-2 text-sm text-ink-muted">No transfers recorded for this distribution.</p>'}
      <button type="button" data-new-transfer class="mt-4 min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">+ Record transfer</button>
      <form data-transfer-form class="hidden mt-4 grid gap-3 sm:grid-cols-2">
        ${formField({ name: 'transfer_date', id: `transfer-date-${record.id}`, label: 'Transfer date', type: 'date', value: todayISO() })}
        ${formField({ name: 'amount', label: 'Transfer amount', type: 'number', inputmode: 'decimal', min: 0.01, step: '0.01' })}
        ${formField({ name: 'note', label: 'Note (optional)', required: false, placeholder: 'Reference or sender' })}
        <button type="submit" class="min-h-11 self-end rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">Record transfer</button>
        <div data-transfer-message class="sm:col-span-2" aria-live="polite"></div>
      </form>
    </div>`;
}

function segment(cols, items, value, name) {
  return `<div class="mt-1.5 grid gap-1 rounded-lg border border-line bg-surface p-1" role="group" aria-label="${name}" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr))">${items.map((item) => `<button type="button" data-seg-value="${item.value}" aria-pressed="${item.value === value ? 'true' : 'false'}" class="min-h-11 rounded-md px-3 text-sm font-medium ${item.value === value ? 'bg-primary text-surface' : 'text-ink-muted hover:bg-surface-alt'}">${item.label}</button>`).join('')}</div>`;
}

function wireSegment(container, name, onChange) {
  container.querySelector(`[role="group"][aria-label="${name}"]`).addEventListener('click', (event) => {
    const button = event.target.closest('[data-seg-value]');
    if (!button) return;
    button.parentElement.querySelectorAll('[data-seg-value]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('bg-primary', active);
      item.classList.toggle('text-surface', active);
      item.classList.toggle('text-ink-muted', !active);
      item.classList.toggle('hover:bg-surface-alt', !active);
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    onChange(button.dataset.segValue);
  });
}

async function loadList(listEl, filter) {
  listEl.innerHTML = '<p class="py-2 text-ink-muted">Loading...</p>';
  try {
    const records = await getDistributions(filter);
    listEl.innerHTML = records.length
      ? records.map(distRow).join('')
      : '<p data-empty class="py-2 text-ink-muted">No distribution records yet. Add the first entry above.</p>';
  } catch (err) {
    listEl.innerHTML = `<p class="py-2 text-debt">${escapeHtml(err.message)}</p>`;
  }
}

function channelTag(channel) {
  const label = channel === 'keke' ? 'Keke' : 'Van';
  return `<span class="rounded border border-line bg-surface-alt px-2 py-0.5 text-xs font-medium text-ink">${label}</span>`;
}

function distRow(record) {
  const balance = Number(record.balance);
  const balanceLabel = balance > 0 ? `Owed ${formatNaira(balance)}` : balance < 0 ? `Credit ${formatNaira(Math.abs(balance))}` : 'Settled';
  return `<div class="border-b border-line px-4 py-3" data-dist-id="${record.id}">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span class="min-w-0 flex-1 text-sm tabular-nums text-ink">${formatDate(record.dist_date || record.date)}</span>
      <span>${channelTag(record.channel)}</span>
      <span class="text-sm text-ink">${escapeHtml(record.recipient_name || 'Name not recorded')}</span>
      <span class="text-sm tabular-nums text-ink">${formatNumber(record.quantity_given)} bags</span>
      <span data-row-balance class="text-sm tabular-nums ${balance > 0 ? 'font-semibold text-warning' : 'text-ink-muted'}">${balanceLabel}</span>
      <button type="button" data-dist-details class="min-h-11 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink">Details</button>
    </div>
    <div data-dist-detail class="hidden"></div>
  </div>`;
}
