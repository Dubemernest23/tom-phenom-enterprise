import { getCustomers, getCustomer, createCustomer, addCustomerTransaction, updateCustomerTransaction } from '../api.js';
import { formField } from '../components/form-field.js';
import { listRow } from '../components/list-row.js';
import { formatNaira, formatNumber, formatDate, todayISO, escapeHtml } from '../utils.js';
import { attachFormModal } from '../components/form-modal.js';

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
  const customerModal = attachFormModal(container, form, btn, 'Add customer');

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
    customerModal.close();
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

    <button type="button" id="new-transaction" class="mt-6 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ New transaction</button>
    <form id="txn-form" class="mt-3 flex flex-col gap-4">
      ${formField({ name: 'txn_date', label: 'Date', type: 'date', value: todayISO() })}
      ${formField({ name: 'quantity', label: 'Quantity', type: 'number', inputmode: 'numeric', min: 0 })}
      ${formField({ name: 'price_given', label: 'Price given', type: 'number', inputmode: 'decimal', min: 0, step: '0.01' })}
      <p class="rounded-lg bg-surface-alt p-3 text-sm text-ink">Expected amount: <strong data-expected-amount>₦0</strong></p>
      ${formField({ name: 'amount_paid', label: 'Amount received', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: '0' })}
      ${formField({ name: 'payment_date', label: 'Date received', type: 'date', value: todayISO() })}
      <div class="flex flex-col gap-1.5"><label for="payment_method" class="text-sm font-medium text-ink">Payment method</label><select id="payment_method" name="payment_method" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="">Not recorded</option></select></div>
      <div class="flex flex-col gap-1.5"><label for="payment_status" class="text-sm font-medium text-ink">Payment status</label><select id="payment_status" name="payment_status" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="pay_later">Will pay later</option><option value="paid">Paid</option></select></div>
      <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Save transaction</button>
    </form>
    <div id="txn-summary" class="mt-4"></div>

    <h2 class="mt-8 font-heading text-lg font-semibold text-ink">History</h2>
    <div id="history" class="mt-3"></div>`;

  var form = container.querySelector('#txn-form');
  var summaryEl = container.querySelector('#txn-summary');
  var historyEl = container.querySelector('#history');
  var headlineEl = container.querySelector('[data-headline]');
  var expectedEl = form.querySelector('[data-expected-amount]');
  var editingTransaction = null;
  const transactionModal = attachFormModal(container, form, container.querySelector('#new-transaction'), 'New customer transaction');
  container.querySelector('#new-transaction').addEventListener('click', () => {
    editingTransaction = null;
    form.reset();
    form.querySelector('button[type="submit"]').textContent = 'Save transaction';
    form.elements.txn_date.value = todayISO();
    form.elements.amount_paid.value = '0';
    form.elements.payment_date.value = todayISO();
    form.elements.payment_method.value = 'cash';
    form.elements.payment_status.value = 'pay_later';
    updateExpected();
  });

  if (txns.length === 0) {
    historyEl.innerHTML = '<p data-empty class="text-ink-muted py-2">No transactions yet.</p>';
  } else {
    historyEl.innerHTML = txns.map(txnRow).join('');
  }

  function updateExpected() {
    expectedEl.textContent = formatNaira(Number((Number(form.elements.quantity.value || 0) * Number(form.elements.price_given.value || 0)).toFixed(2)));
  }
  form.elements.quantity.addEventListener('input', updateExpected);
  form.elements.price_given.addEventListener('input', updateExpected);
  historyEl.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-transaction]');
    if (!edit) return;
    editingTransaction = txns.find((txn) => Number(txn.id) === Number(edit.dataset.editTransaction));
    if (!editingTransaction) return;
    form.elements.txn_date.value = editingTransaction.txn_date;
    form.elements.quantity.value = editingTransaction.quantity;
    form.elements.price_given.value = editingTransaction.price_given;
    form.elements.amount_paid.value = editingTransaction.amount_paid;
    form.elements.payment_date.value = editingTransaction.payment_date || todayISO();
    form.elements.payment_method.value = editingTransaction.payment_method || '';
    form.elements.payment_status.value = editingTransaction.payment_status || 'pay_later';
    form.querySelector('button[type="submit"]').textContent = 'Update transaction';
    updateExpected();
    transactionModal.open();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var body = {
      txn_date: fd.get('txn_date'),
      quantity: Number(fd.get('quantity')),
      price_given: Number(fd.get('price_given')),
      amount_paid: Number(fd.get('amount_paid')),
      payment_date: Number(fd.get('amount_paid')) > 0 ? fd.get('payment_date') : null,
      payment_method: fd.get('payment_method') || null,
      payment_status: fd.get('payment_status'),
    };

    var result;
    try {
      result = editingTransaction
        ? await updateCustomerTransaction(id, editingTransaction.id, body)
        : await addCustomerTransaction(id, body);
    } catch (err) {
      summaryEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      return;
    }

    summaryEl.innerHTML = `
      <div class="rounded-lg bg-surface-alt p-4">
        <p class="text-sm font-medium text-ink-muted">Transaction ${editingTransaction ? 'updated' : 'saved'}</p>
        <div class="mt-2 flex flex-col gap-1">
          <p class="text-sm text-ink">Amount expected: <span class="font-semibold tabular-nums">${formatNaira(result.amount_expected)}</span></p>
          <p class="text-sm text-ink">Amount received: <span class="font-semibold tabular-nums">${formatNaira(result.amount_paid)}</span></p>
          <p class="text-sm text-ink">Balance: <span class="font-semibold tabular-nums ${result.balance > 0 ? 'text-warning' : 'text-ink-muted'}">${formatNaira(result.balance)}</span></p>
        </div>
      </div>`;

    var merged = Object.assign({}, body, result);
    var emptyMsg = historyEl.querySelector('[data-empty]');
    if (emptyMsg) emptyMsg.remove();
    if (editingTransaction) {
      const oldRow = historyEl.querySelector(`[data-transaction-row="${editingTransaction.id}"]`);
      if (oldRow) oldRow.outerHTML = txnRow(merged);
      balance += Number(result.balance) - Number(editingTransaction.balance);
      txns = txns.map((txn) => Number(txn.id) === Number(result.id) ? merged : txn);
    } else {
      historyEl.insertAdjacentHTML('afterbegin', txnRow(merged));
      balance += Number(result.balance || 0);
      txns.unshift(merged);
    }
    headlineEl.textContent = formatNaira(balance);
    headlineEl.className = 'mt-4 font-heading text-2xl font-bold tabular-nums ' + (balance > 0 ? 'text-warning' : 'text-ink-muted');
    transactionModal.close();
    editingTransaction = null;
    form.querySelector('button[type="submit"]').textContent = 'Save transaction';

    form.reset();
    form.elements.txn_date.value = todayISO();
    form.elements.amount_paid.value = '0';
    form.elements.payment_date.value = todayISO();
    form.elements.payment_method.value = 'cash';
    form.elements.payment_status.value = 'pay_later';
    updateExpected();
  });
}

function txnRow(t) {
  var bal = formatNaira(t.balance);
  if (t.balance > 0) bal = 'Owed ' + bal;
  const method = t.payment_method ? ` · ${escapeHtml(t.payment_method)}` : '';
  const paidStatus = t.payment_status === 'paid';
  return `<div data-transaction-row="${t.id}" class="border-b border-line px-4 py-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div><p class="text-sm font-medium text-ink">${formatDate(t.txn_date || t.date)} · ${formatNumber(t.quantity)} bags</p>
      <p class="mt-1 text-xs text-ink-muted">Expected ${formatNaira(t.amount_expected)} · Received ${formatNaira(t.amount_paid)}${method}${t.payment_date ? ` · ${formatDate(t.payment_date)}` : ''}</p>
      <p class="mt-1 text-xs ${paidStatus ? 'text-positive' : 'text-warning'}">${paidStatus ? 'Paid' : 'Will pay later'} · Balance ${bal}</p></div>
      <button type="button" data-edit-transaction="${t.id}" class="min-h-11 rounded-lg border border-primary px-3 py-2 text-sm font-medium text-primary">Edit</button>
    </div>
  </div>`;
}
