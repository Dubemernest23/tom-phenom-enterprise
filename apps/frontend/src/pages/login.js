import { login } from '../api.js';
import { setSession } from '../state.js';
import { formField } from '../components/form-field.js';
import { tpMonogram } from '../components/logo.js';

export function render(container) {
  container.innerHTML = `
    <section class="mx-auto mt-10 w-full max-w-sm">
      <div class="flex flex-col items-center text-center">
        ${tpMonogram('h-12 w-12 text-primary')}
        <p class="mt-3 font-heading text-2xl font-bold text-ink">TOM-PHENOM</p>
        <p class="mt-1 text-xs font-medium tracking-wordmark text-ink-muted">ENTERPRISE</p>
      </div>

      <form id="login-form" class="mt-8 flex flex-col gap-4">
        ${formField({ name: 'username', label: 'Username' })}
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-sm font-medium text-ink">Password</label>
          <div class="relative">
            <input type="password" id="password" name="password" required autocomplete="current-password" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 pr-12 text-base text-ink focus:border-primary" />
            <button type="button" id="toggle-password" aria-label="Show password" aria-pressed="false" class="absolute inset-y-0 right-1 flex min-h-11 w-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt">
              <svg data-eye viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Sign in</button>
      </form>

      <div id="login-msg" class="mt-4"></div>
    </section>`;

  var form = container.querySelector('#login-form');
  var msgEl = container.querySelector('#login-msg');
  var passwordInput = form.elements.password;
  var passwordToggle = container.querySelector('#toggle-password');
  passwordToggle.addEventListener('click', function () {
    var visible = passwordInput.type === 'password';
    passwordInput.type = visible ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', String(visible));
    passwordToggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    passwordToggle.innerHTML = visible
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a15 15 0 0 1-3.2 4.1"/><path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10 10 0 0 0 4-.8"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    msgEl.innerHTML = '';

    var fd = new FormData(form);
    var body = {
      username: String(fd.get('username') || '').trim(),
      password: String(fd.get('password') || ''),
    };

    var result;
    try {
      result = await login(body);
    } catch (err) {
      msgEl.innerHTML = '<p class="rounded-lg border border-debt bg-surface p-4 text-debt">' + err.message + '</p>';
      btn.disabled = false;
      return;
    }

    setSession({
      token: result.token,
      user: result.user || { username: body.username },
    });
    location.hash = '#/dashboard';
  });
}
