import { getTaxes, createTax, updateTax } from '../api.js';
import { formField } from '../components/form-field.js';
import { attachFormModal } from '../components/form-modal.js';
import { escapeHtml, formatDate, formatNaira, todayISO } from '../utils.js';

export async function render(container) {
  const today = todayISO();
  container.innerHTML = `<div class="flex items-center justify-between gap-3"><h1 class="font-heading text-xl font-semibold text-ink">Taxes and statutory payments</h1><button id="new-tax" type="button" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ Add tax record</button></div>
    <p class="mt-2 text-sm text-ink-muted">Track each tax or statutory charge by agency, type, payment period, amount paid, and next due date.</p>
    <form id="tax-form" class="hidden flex-col gap-4">
      ${formField({ name: 'tax_name', label: 'Agency or tax name', placeholder: 'e.g. FIRS, ESIRS, ESWAMA' })}
      ${formField({ name: 'description', label: 'Tax type / description', placeholder: 'e.g. Water tax, yearly emblem' })}
      <div class="flex flex-col gap-1.5"><label for="frequency" class="text-sm font-medium text-ink">Payment frequency</label><select id="frequency" name="frequency" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
      ${formField({ name: 'period_label', label: 'Period', value: today.slice(0, 7), placeholder: 'YYYY-MM or YYYY' })}
      ${formField({ name: 'due_date', label: 'Due date', type: 'date', value: today })}
      ${formField({ name: 'amount_due', label: 'Amount due', type: 'number', min: 0, step: '0.01', value: '0' })}
      ${formField({ name: 'amount_paid', label: 'Amount paid', type: 'number', min: 0, step: '0.01', value: '0' })}
      ${formField({ name: 'payment_date', label: 'Date paid', type: 'date', value: today, required: false })}
      <div id="tax-feedback" role="alert" aria-live="assertive"></div>
      <button type="submit" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-surface">Save tax record</button>
      <button type="button" data-cancel class="hidden min-h-11 rounded-lg border border-line px-4 py-2 text-ink">Cancel edit</button>
    </form>
    <div id="tax-message" class="mt-3"></div><div id="tax-list" class="mt-3"></div>`;
  const form = container.querySelector('#tax-form');
  const modal = attachFormModal(container, form, container.querySelector('#new-tax'), 'Tax or statutory payment');
  const list = container.querySelector('#tax-list');
  const cancel = form.querySelector('[data-cancel]');
  let records = [];
  let editing = null;
  form.elements.frequency.addEventListener('change', () => {
    const year = todayISO().slice(0, 4);
    form.elements.period_label.value = form.elements.frequency.value === 'monthly' ? todayISO().slice(0, 7) : year;
  });
  function reset(record = null) {
    editing = record;
    form.elements.tax_name.value = record?.tax_name || '';
    form.elements.description.value = record?.description || '';
    form.elements.frequency.value = record?.frequency || 'monthly';
    form.elements.period_label.value = record?.period_label || todayISO().slice(0, 7);
    form.elements.due_date.value = record?.due_date || todayISO();
    form.elements.amount_due.value = record?.amount_due ?? '0';
    form.elements.amount_paid.value = record?.amount_paid ?? '0';
    form.elements.payment_date.value = record?.payment_date || todayISO();
    form.querySelector('button[type="submit"]').textContent = record ? 'Update tax record' : 'Save tax record';
    cancel.classList.toggle('hidden', !record);
    form.querySelector('#tax-feedback').innerHTML = '';
  }
  container.querySelector('#new-tax').addEventListener('click', () => reset());
  function renderRows() {
    list.innerHTML = records.length ? records.map((r) => {
      const late = Number(r.balance) > 0 && r.due_date < todayISO();
      return `<article class="border-b border-line px-4 py-4"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="font-semibold text-ink">${escapeHtml(r.tax_name)} · ${escapeHtml(r.description)}</h2><p class="mt-1 text-sm text-ink-muted">${escapeHtml(r.period_label)} · ${escapeHtml(r.frequency)} · Due ${formatDate(r.due_date)}</p><p class="mt-2 text-sm text-ink">Due ${formatNaira(r.amount_due)} · Paid ${formatNaira(r.amount_paid)}${r.payment_date ? ` · Paid ${formatDate(r.payment_date)}` : ''}</p><p class="mt-1 text-sm ${late ? 'font-semibold text-debt' : Number(r.balance) > 0 ? 'text-warning' : 'text-positive'}">${late ? 'Overdue' : Number(r.balance) > 0 ? 'Outstanding' : 'Paid'} · Balance ${formatNaira(r.balance)}</p></div><button type="button" data-edit-tax="${r.id}" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm text-primary">Edit</button></div></article>`;
    }).join('') : '<p class="py-3 text-ink-muted">No tax payments recorded.</p>';
  }
  async function reload() {
    list.innerHTML = '<p class="py-3 text-ink-muted">Loading tax records...</p>';
    try { records = await getTaxes(); renderRows(); }
    catch (err) { list.innerHTML = `<p class="py-3 text-debt">${escapeHtml(err.message)}</p>`; }
  }
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-edit-tax]');
    if (!button) return;
    const record = records.find((item) => Number(item.id) === Number(button.dataset.editTax));
    if (record) { reset(record); modal.open(); }
  });
  cancel.addEventListener('click', () => { reset(); modal.close(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const fd = new FormData(form);
    const readNumber = (name) => {
      const raw = form.elements.namedItem(name)?.value;
      if (raw === '' || raw == null) return 0;
      const value = Number(raw);
      return Number.isFinite(value) ? value : NaN;
    };
    const amountPaid = readNumber('amount_paid');
    const body = {
      tax_name: String(fd.get('tax_name') || '').trim(), description: String(fd.get('description') || '').trim(),
      frequency: fd.get('frequency'), period_label: String(fd.get('period_label') || '').trim(), due_date: fd.get('due_date'),
      amount_due: readNumber('amount_due'), amount_paid, payment_date: amountPaid > 0 ? fd.get('payment_date') : null,
    };
    try { editing ? await updateTax(editing.id, body) : await createTax(body); reset(); modal.close(); await reload(); }
    catch (err) {
      form.querySelector('#tax-feedback').innerHTML = `<p class="rounded-lg border border-debt bg-surface p-4 text-debt">Could not save this tax record: ${escapeHtml(err.message)}</p>`;
      form.querySelector('#tax-feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
  await reload();
}
