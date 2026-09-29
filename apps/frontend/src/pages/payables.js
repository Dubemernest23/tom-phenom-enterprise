import { getCreditors, getCreditor, createCreditor, addPayableTransaction } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow, stackedRow } from '../components/list-row.js';
import { formatNaira, formatDate, todayISO, escapeHtml } from '../utils.js';

export async function render(container, params) {
  return params && params.id ? renderDetail(container, params.id) : renderList(container);
}

// ---------- List view (#/payables) ----------

async function renderList(container) {
  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-heading text-xl font-semibold text-ink">Payables</h1>
      <button type="button" id="add-creditor-btn" aria-expanded="false" aria-controls="creditor-form" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-surface">+ Add creditor</button>
    </div>

    <form id="creditor-form" class="mt-4 hidden flex-col gap-4">
      ${formField({ name: 'name', label: 'Name' })}
      ${formField({ name: 'category', label: 'Category (optional)', required: false, placeholder: 'e.g. nylon supplier' })}
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save creditor</button>
    </form>

    <div id="creditor-msg" class="mt-4"></div>
    <div id="creditor-list" class="mt-3"></div>`;

  var btn = container.querySelector('#add-creditor-btn');
  var form = container.querySelector('#creditor-form');
  var msgEl = container.querySelector('#creditor-msg');
  var listEl = container.querySelector('#creditor-list');

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
      category: String(fd.get('category') || '').trim() || null,
    };

    try {
      await createCreditor(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    msgEl.innerHTML = '<p class="rounded-lg border border-positive bg-surface p-4 text-positive">Creditor added.</p>';
    form.reset();
    toggleForm();
    loadList(listEl);
  });
}

async function loadList(listEl) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var creditors;
  try {
    creditors = await getCreditors();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!creditors || creditors.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No creditors yet. Add the first one above.</p>';
    return;
  }
  var sorted = creditors.slice().sort(function (a, b) { return (b.balance || 0) - (a.balance || 0); });
  listEl.innerHTML = sorted.map(creditorRow).join('');
}

function creditorRow(c) {
  var bal = formatNaira(c.balance);
  if (c.balance > 0) bal = 'Owe ' + bal;
  return listRow([
    { value: escapeHtml(c.name), className: 'text-ink' },
    { value: escapeHtml(c.category) || '—', className: 'text-ink-muted' },
    { value: bal, className: c.balance > 0 ? 'font-semibold text-debt' : 'text-ink-muted' },
  ], { href: '#/payables/' + c.id });
}

// ---------- Detail view (#/payables/:id) ----------

async function renderDetail(container, id) {
  container.innerHTML = '<p class="text-ink-muted py-4">Loading creditor...</p>';
  var creditor;
  try {
    creditor = await getCreditor(id);
  } catch (err) {
    container.innerHTML = '<p class="text-debt py-4">Failed to load creditor: ' + err.message + '</p>';
    return;
  }

  var balance = Number(creditor.balance || 0);
  var txns = creditor.transactions || [];

  container.innerHTML = `
    <p class="text-sm text-ink-muted"><a href="#/payables" class="text-primary">Payables</a> / ${escapeHtml(creditor.name)}</p>
    <h1 class="mt-1 font-heading text-xl font-semibold text-ink">${escapeHtml(creditor.name)}</h1>
    ${creditor.category ? '<p class="mt-1 text-sm text-ink-muted">' + escapeHtml(creditor.category) + '</p>' : ''}

    <p class="mt-4 font-heading text-2xl font-bold tabular-nums ${balance > 0 ? 'text-debt' : 'text-ink-muted'}" data-headline>${formatNaira(balance)}</p>
    <p class="text-sm font-medium text-ink-muted">Outstanding balance</p>

    <h2 class="mt-6 font-heading text-lg font-semibold text-ink">New transaction</h2>
    <form id="txn-form" class="mt-3 flex flex-col gap-4">
      ${formField({ name: 'txn_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'description', label: 'Description', required: false })}
      ${formField({ name: 'amount_owed', label: 'Amount owed', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'amount_paid', label: 'Amount paid', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save transaction</button>
    </form>
    <div id="txn-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">History</h2>
    <div id="history" class="mt-3"></div>`;

  var form = container.querySelector('#txn-form');
  var summaryEl = container.querySelector('#txn-summary');
  var historyEl = container.querySelector('#history');
  var headlineEl = container.querySelector('[data-headline]');

  if (txns.length === 0) {
    historyEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No transactions yet.</p>';
  } else {
    historyEl.innerHTML = txns.map(txnRow).join('');
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      txn_date: fd.get('txn_date'),
      description: String(fd.get('description') || '').trim() || null,
      amount_owed: Number(fd.get('amount_owed')),
      amount_paid: Number(fd.get('amount_paid')),
    };

    var result;
    try {
      result = await addPayableTransaction(id, body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Transaction saved</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-debt' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var merged = Object.assign({}, body, result);
    var emptyMsg = historyEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    historyEl.insertAdjacentHTML('afterbegin', txnRow(merged));

    balance = balance + Number(result.balance || 0);
    headlineEl.textContent = formatNaira(balance);
    headlineEl.className = 'mt-4 font-heading text-2xl font-bold tabular-nums ' + (balance > 0 ? 'text-debt' : 'text-ink-muted');

    form.reset();
    form.elements.txn_date.value = todayISO();
    form.elements.amount_paid.value = '0';
  });
}

function txnRow(t) {
  return stackedRow({
    primary: formatDate(t.txn_date || t.date) + (t.description ? ' · ' + escapeHtml(t.description) : ''),
    secondary: 'Owed ' + formatNaira(t.amount_owed) + ' · Paid ' + formatNaira(t.amount_paid),
    value: 'Balance ' + formatNaira(t.balance),
    valueClass: t.balance > 0 ? 'text-debt' : 'text-ink-muted',
  });
}