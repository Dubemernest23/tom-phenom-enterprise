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
        ${formField({ name: 'password', label: 'Password', type: 'password' })}
        <button type="submit" class="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface hover:bg-primary-dark">Sign in</button>
      </form>

      <div id="login-msg" class="mt-4"></div>
    </section>`;

  var form = container.querySelector('#login-form');
  var msgEl = container.querySelector('#login-msg');

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