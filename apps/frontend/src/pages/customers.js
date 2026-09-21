import { getCustomers, getCustomer, createCustomer, addCustomerTransaction } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNaira, formatNumber, formatDate, todayISO, escapeHtml } from '../utils.js';

export async function render(container, params) {
  return params && params.id ? renderDetail(container, params.id) : renderList(container);
}

// ---------- List view (#/customers) ----------

async function renderList(container) {
  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-heading text-xl font-semibold text-ink">Customers</h1>
      <button type="button" id="add-customer-btn" aria-expanded="false" aria-controls="customer-form" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-surface">+ Add customer</button>
    </div>

    <form id="customer-form" class="mt-4 hidden flex-col gap-4">
      ${formField({ name: 'name', label: 'Name' })}
      ${formField({ name: 'phone', label: 'Phone (optional)', type: 'tel', inputmode: 'tel', required: false })}
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save customer</button>
    </form>

    <div id="customer-msg" class="mt-4"></div>
    <div id="customer-list" class="mt-3"></div>`;

  var btn = container.querySelector('#add-customer-btn');
  var form = container.querySelector('#customer-form');
  var msgEl = container.querySelector('#customer-msg');
  var listEl = container.querySelector('#customer-list');

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
      phone: String(fd.get('phone') || '').trim() || null,
    };

    try {
      await createCustomer(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    msgEl.innerHTML = '<p class="rounded-lg border border-positive bg-surface p-4 text-positive">Customer added.</p>';
    form.reset();
    toggleForm();
    loadList(listEl);
  });
}

async function loadList(listEl) {
  listEl.innerHTML = '<p class="text-ink-muted py-2">Loading...</p>';
  var customers;
  try {
    customers = await getCustomers();
  } catch (err) {
    listEl.innerHTML = '<p class="text-debt py-2">' + err.message + '</p>';
    return;
  }
  if (!customers || customers.length === 0) {
    listEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No customers yet. Add the first one above.</p>';
    return;
  }
  var sorted = customers.slice().sort(function (a, b) { return (b.balance || 0) - (a.balance || 0); });
  listEl.innerHTML = sorted.map(customerRow).join('');
}

function customerRow(c) {
  var bal = formatNaira(c.balance);
  if (c.balance > 0) bal = 'Owed ' + bal;
  return listRow([
    { value: escapeHtml(c.name), className: 'text-ink' },
    { value: bal, className: c.balance > 0 ? 'font-semibold text-warning' : 'text-ink-muted' },
  ], { href: '#/customers/' + c.id });
}

// ---------- Detail view (#/customers/:id) ----------

async function renderDetail(container, id) {
  container.innerHTML = '<p class="text-ink-muted py-4">Loading customer...</p>';
  var customer;
  try {
    customer = await getCustomer(id);
  } catch (err) {
    container.innerHTML = '<p class="text-debt py-4">Failed to load customer: ' + err.message + '</p>';
    return;
  }

  var balance = Number(customer.balance || 0);
  var txns = customer.transactions || [];

  container.innerHTML = `
    <p class="text-sm text-ink-muted"><a href="#/customers" class="text-primary">Customers</a> / ${escapeHtml(customer.name)}</p>
    <h1 class="mt-1 font-heading text-xl font-semibold text-ink">${escapeHtml(customer.name)}</h1>
    ${customer.phone ? '<p class="mt-1 text-sm text-ink-muted">' + escapeHtml(customer.phone) + '</p>' : ''}

    <p class="mt-4 font-heading text-2xl font-bold tabular-nums ${balance > 0 ? 'text-warning' : 'text-ink-muted'}" data-headline>${formatNaira(balance)}</p>
    <p class="text-sm font-medium text-ink-muted">Running balance</p>

    <h2 class="mt-6 font-heading text-lg font-semibold text-ink">New transaction</h2>
    <form id="txn-form" class="mt-3 flex flex-col gap-4">
      ${formField({ name: 'txn_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'quantity', label: 'Quantity', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'price_given', label: 'Price given', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      ${formField({ name: 'amount_expected', label: 'Amount expected (optional)', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', required: false, placeholder: 'Leave blank to use quantity × price given' })}
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
    var amountExpected = String(fd.get('amount_expected') || '').trim();
    var body = {
      txn_date: fd.get('txn_date'),
      quantity: Number(fd.get('quantity')),
      price_given: Number(fd.get('price_given')),
      amount_paid: Number(fd.get('amount_paid')),
    };
    if (amountExpected !== '') body.amount_expected = Number(amountExpected);

    var result;
    try {
      result = await addCustomerTransaction(id, body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Transaction saved</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Amount expected: <span class="font-semibold tabular-nums">${formatNaira(result.amount_expected)}</span></p>
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-warning' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var merged = Object.assign({}, body, result);
    var emptyMsg = historyEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    historyEl.insertAdjacentHTML('afterbegin', txnRow(merged));

    balance = balance + Number(result.balance || 0);
    headlineEl.textContent = formatNaira(balance);
    headlineEl.className = 'mt-4 font-heading text-2xl font-bold tabular-nums ' + (balance > 0 ? 'text-warning' : 'text-ink-muted');

    form.reset();
    form.elements.txn_date.value = todayISO();
    form.elements.amount_paid.value = '0';
  });
}

function txnRow(t) {
  var bal = formatNaira(t.balance);
  if (t.balance > 0) bal = 'Owed ' + bal;
  return listRow([
    { value: formatDate(t.txn_date || t.date), className: 'text-ink' },
    { value: formatNumber(t.quantity), className: 'text-ink' },
    { value: formatNaira(t.price_given), className: 'text-ink' },
    { value: bal, className: t.balance > 0 ? 'font-semibold text-warning' : 'text-ink-muted' },
  ]);
}