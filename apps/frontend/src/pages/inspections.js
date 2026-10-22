import { getInspections, createInspection, updateInspection } from '../api.js';
import { formField } from '../components/form-field.js';
import { attachFormModal } from '../components/form-modal.js';
import { escapeHtml, formatDate, formatNaira, todayISO } from '../utils.js';

export async function render(container) {
  container.innerHTML = `<div class="flex items-center justify-between gap-3"><h1 class="font-heading text-xl font-semibold text-ink">Government inspections</h1><button id="new-inspection" type="button" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ Log inspection</button></div>
    <form id="inspection-form" class="hidden flex-col gap-4">${fields()}<button type="submit" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-surface">Save inspection</button><button type="button" data-cancel class="hidden min-h-11 rounded-lg border border-line px-4 py-2 text-ink">Cancel edit</button></form>
    <div id="inspection-message" class="mt-3"></div><div id="inspection-list" class="mt-3"></div>`;
  const form = container.querySelector('#inspection-form');
  const modal = attachFormModal(container, form, container.querySelector('#new-inspection'), 'Inspection record');
  const list = container.querySelector('#inspection-list');
  let editing = null;
  let recordsCache = [];
  const cancel = form.querySelector('[data-cancel]');
  function renderRecords(records) {
    return records.length ? records.map((r) => `<article data-inspection="${r.id}" class="border-b border-line px-4 py-4"><div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="font-semibold text-ink">${escapeHtml(r.agency_name)}</h2><p class="mt-1 text-sm text-ink-muted">${formatDate(r.inspection_date)} · Fees ${formatNaira(r.fee_paid)} · Tips ${formatNaira(r.tips_paid)}</p><p class="mt-2 text-sm text-ink"><strong>Checked:</strong> ${escapeHtml(r.checked_items)}</p>${r.recommendations ? `<p class="mt-1 text-sm text-ink-muted"><strong>Recommendations:</strong> ${escapeHtml(r.recommendations)}</p>` : ''}</div><button type="button" data-edit-inspection="${r.id}" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm text-primary">Edit</button></div></article>`).join('') : '<p class="py-3 text-ink-muted">No inspection records yet.</p>';
  }
  async function refresh() {
    list.innerHTML = '<p class="py-3 text-ink-muted">Loading inspections...</p>';
    try {
      recordsCache = await getInspections();
      list.innerHTML = renderRecords(recordsCache);
    } catch (err) { recordsCache = []; list.innerHTML = `<p class="py-3 text-debt">${escapeHtml(err.message)}</p>`; }
  }
  function setForm(r = null) {
    editing = r;
    form.elements.agency_name.value = r?.agency_name || '';
    form.elements.checked_items.value = r?.checked_items || '';
    form.elements.inspection_date.value = r?.inspection_date || todayISO();
    form.elements.recommendations.value = r?.recommendations || '';
    form.elements.fee_paid.value = r?.fee_paid || '0';
    form.elements.tips_paid.value = r?.tips_paid || '0';
    form.querySelector('button[type="submit"]').textContent = r ? 'Update inspection' : 'Save inspection';
    cancel.classList.toggle('hidden', !r);
  }
  container.querySelector('#new-inspection').addEventListener('click', () => setForm());
  list.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-edit-inspection]'); if (!btn) return;
    const record = recordsCache.find((item) => Number(item.id) === Number(btn.dataset.editInspection));
    if (record) { setForm(record); modal.open(); }
  });
  cancel.addEventListener('click', () => { setForm(); modal.close(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const fd = new FormData(form);
    const body = { agency_name: String(fd.get('agency_name') || '').trim(), checked_items: String(fd.get('checked_items') || '').trim(), inspection_date: fd.get('inspection_date'), recommendations: String(fd.get('recommendations') || '').trim() || null, fee_paid: Number(fd.get('fee_paid')), tips_paid: Number(fd.get('tips_paid')) };
    try { editing ? await updateInspection(editing.id, body) : await createInspection(body); setForm(); modal.close(); await refresh(); }
    catch (err) { container.querySelector('#inspection-message').innerHTML = `<p class="text-debt">${escapeHtml(err.message)}</p>`; }
  });
  await refresh();
}

function fields() {
  return `${formField({ name: 'agency_name', label: 'Agency name' })}
    ${formField({ name: 'inspection_date', label: 'Inspection date', type: 'date', value: todayISO() })}
    <div class="flex flex-col gap-1.5"><label for="checked_items" class="text-sm font-medium text-ink">What they checked</label><textarea id="checked_items" name="checked_items" required maxlength="5000" rows="3" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"></textarea></div>
    <div class="flex flex-col gap-1.5"><label for="recommendations" class="text-sm font-medium text-ink">Recommendations</label><textarea id="recommendations" name="recommendations" maxlength="5000" rows="3" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"></textarea></div>
    ${formField({ name: 'fee_paid', label: 'Inspection fee paid', type: 'number', min: 0, step: '0.01', value: '0' })}
    ${formField({ name: 'tips_paid', label: 'Tips paid', type: 'number', min: 0, step: '0.01', value: '0' })}`;
}
