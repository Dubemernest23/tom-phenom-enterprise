import { createPanelUser } from '../api.js';
import { formField } from '../components/form-field.js';
import { escapeHtml } from '../utils.js';

export function render(container) {
  container.innerHTML = `
    <h1 class="font-heading text-xl font-semibold text-ink">Access accounts</h1>
    <p class="mt-2 text-sm text-ink-muted">Create a manager account for read-only access to the full panel, or a supervisor account with Staffing, Payroll, and Payables restricted.</p>
    <form id="account-form" class="mt-5 flex flex-col gap-4 rounded-lg border border-line p-4">
      ${formField({ name: 'username', label: 'Username', required: true })}
      ${formField({ name: 'password', label: 'Temporary password (10+ characters)', type: 'password', required: true })}
      <div class="flex flex-col gap-1.5"><label for="account-role" class="text-sm font-medium text-ink">Access level</label><select id="account-role" name="role" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="MANAGER">Manager · read-only all sections</option><option value="SUPERVISOR">Supervisor · excludes Staffing, Payroll, Payables</option></select></div>
      <button type="submit" class="min-h-11 rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface">Create account</button>
    </form>
    <div id="account-result" class="mt-4" aria-live="polite"></div>`;
  const form = container.querySelector('#account-form');
  form.querySelector('[name="username"]').minLength = 3;
  form.querySelector('[name="username"]').maxLength = 100;
  form.querySelector('[name="password"]').minLength = 10;
  const result = container.querySelector('#account-result');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const values = new FormData(form);
    try {
      const account = await createPanelUser({ username: String(values.get('username') || '').trim(), password: String(values.get('password') || ''), role: values.get('role') });
      result.innerHTML = `<p class="rounded-lg border border-positive p-3 text-positive">${escapeHtml(account.role.toLowerCase())} account “${escapeHtml(account.username)}” created.</p>`;
      form.reset();
    } catch (error) {
      result.innerHTML = `<p class="rounded-lg border border-debt p-3 text-debt">${escapeHtml(error.message)}</p>`;
    } finally { button.disabled = false; }
  });
}
