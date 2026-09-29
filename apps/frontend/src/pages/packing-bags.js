import { getPackingBagBatches, createPackingBagBatch, usePackingBagBatch } from '../api.js';
import { formField } from '../components/form-field.js';
import { formatNumber, formatDate, todayISO, escapeHtml } from '../utils.js';

const inputClass = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-primary';

export async function render(container) {
  container.innerHTML = `
    <h1 class="font-heading text-xl font-semibold text-ink">Packing bags</h1>

    <form id="batch-form" class="mt-6 flex flex-col gap-4">
      ${formField({ name: 'received_date', label: 'Date received', type: 'date', value: todayISO() })}
      ${formField({ name: 'quantity_received', label: 'Quantity received', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'note', label: 'Note (optional)', required: false, placeholder: 'e.g. supplier, batch reference' })}
      <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Add batch</button>
    </form>

    <div id="batch-msg" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">Batches</h2>
    <div id="batch-list" class="mt-3"></div>`;

  var form = container.querySelector('#batch-form');
  var msgEl = container.querySelector('#batch-msg');
  var listEl = container.querySelector('#batch-list');

  loadList(listEl);

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      received_date: fd.get('received_date'),
      quantity_received: Number(fd.get('quantity_received')),
      note: String(fd.get('note') || '').trim() || null,
    };

    try {
      await createPackingBagBatch(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    msgEl.innerHTML = '<p class="rounded-lg border border-positive bg-surface p-4 text-positive">Batch added.</p>';
    form.reset();
    form.elements.received_date.value = todayISO();
    loadList(listEl);
  });
}

async function loadList(listEl) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var batches;
  try {
    batches = await getPackingBagBatches();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!batches || batches.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No packing bag batches yet. Add your first batch above.</p>';
    return;
  }
  listEl.innerHTML = batches.map(batchRow).join('');
  wireUseForms(listEl);
}

function dateOf(b) {
  return b.received_date || b.date;
}

function batchRow(b) {
  return `
    <div class="border-b border-line px-4 py-3" data-batch="${b.id}">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span class="min-w-0 flex-1 text-sm tabular-nums text-ink">${formatDate(dateOf(b))}</span>
        <span class="text-sm tabular-nums text-ink-muted">In: <span class="text-ink">${formatNumber(b.quantity_received)}</span></span>
        <span class="text-sm tabular-nums font-semibold text-ink">Remaining: <span data-remaining>${formatNumber(b.quantity_remaining)}</span></span>
        <button type="button" data-toggle-use class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-surface">Use bags</button>
      </div>
      ${b.note ? '<p class="mt-1 text-xs text-ink-muted">' + escapeHtml(b.note) + '</p>' : ''}
      <div class="mt-3 hidden" data-use-form>
        <form data-use-inner>
          <div class="flex flex-col gap-1.5">
            <label for="use-date-${b.id}" class="text-sm font-medium text-ink">Date used</label>
            <input type="date" id="use-date-${b.id}" name="usage_date" class="${inputClass}" required>
          </div>
          <div class="mt-3 flex flex-col gap-1.5">
            <label for="use-qty-${b.id}" class="text-sm font-medium text-ink">Quantity used</label>
            <input type="number" id="use-qty-${b.id}" name="quantity_used" inputmode="numeric" min="1" class="${inputClass}" required>
          </div>
          <button type="submit" class="mt-3 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-surface hover:bg-primary-dark">Save usage</button>
        </form>
        <p class="mt-2 text-sm text-debt" data-use-msg></p>
      </div>
    </div>`;
}

function wireUseForms(listEl) {
  listEl.querySelectorAll('[data-toggle-use]').forEach(function (btn) {
    btn.addEventListener('click', () => {
      var row = btn.closest('[data-batch]');
      var useForm = row.querySelector('[data-use-form]');
      var open = useForm.classList.contains('hidden');
      if (open) {
        useForm.classList.remove('hidden');
        useForm.querySelector('input[name="usage_date"]').value = todayISO();
        useForm.querySelector('input[name="quantity_used"]').value = '';
        useForm.querySelector('[data-use-msg]').innerHTML = '';
        useForm.querySelector('input[name="quantity_used"]').focus();
      } else {
        useForm.classList.add('hidden');
      }
    });
  });

  listEl.querySelectorAll('[data-use-inner]').forEach(function (formEl) {
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      var row = formEl.closest('[data-batch]');
      var id = row.dataset.batch;
      var useForm = row.querySelector('[data-use-form]');
      var msgEl = row.querySelector('[data-use-msg]');
      msgEl.innerHTML = '';

      var fd = new FormData(formEl);
      var body = {
        usage_date: fd.get('usage_date'),
        quantity_used: Number(fd.get('quantity_used')),
      };

      var result;
      try {
        result = await usePackingBagBatch(id, body);
      } catch (err) {
        msgEl.innerHTML = err.message;
        return;
      }

      var rem = result && result.quantity_remaining != null
        ? result.quantity_remaining
        : result && result.batch && result.batch.quantity_remaining != null
          ? result.batch.quantity_remaining
          : null;

      if (rem != null) {
        row.querySelector('[data-remaining]').textContent = formatNumber(rem);
        msgEl.innerHTML = '<span class="text-positive">Saved — ' + formatNumber(rem) + ' bags left.</span>';
      } else {
        msgEl.innerHTML = 'Saved.';
      }

      useForm.querySelector('input[name="usage_date"]').value = todayISO();
      useForm.querySelector('input[name="quantity_used"]').value = '';
    });
  });
}