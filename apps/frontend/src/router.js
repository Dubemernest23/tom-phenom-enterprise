const routes = {};
let guard = null;
import { getUserRole } from './state.js';

export function registerRoute(path, module) {
  routes[path] = module;
}

export function setRouteGuard(fn) {
  guard = fn;
}

export function initRouter(container) {
  function onHashChange() {
    const hash = location.hash || '#/';
    const path = hash.slice(1) || '/';
    renderRoute(path, container);
  }

  window.addEventListener('hashchange', onHashChange);
  onHashChange();
}

function renderRoute(path, container) {
  if (guard && guard(path) === false) return;
  if (Object.keys(routes).length === 0) return;
  for (const [pattern, module] of Object.entries(routes)) {
    const params = matchRoute(pattern, path);
    if (params !== null) {
      const rendered = module.render(container, params);
      if (getUserRole() === 'MANAGER') {
        Promise.resolve(rendered).then(() => {
          if (!container.isConnected || getUserRole() !== 'MANAGER') return;
          container.querySelectorAll('form, button').forEach((element) => { element.hidden = true; element.style.display = 'none'; });
          container.querySelectorAll('a').forEach((link) => {
            if (/^\s*\+/.test(link.textContent || '')) { link.hidden = true; link.style.display = 'none'; }
          });
          const notice = document.createElement('p');
          notice.className = 'mb-4 rounded-lg border border-line bg-surface-alt p-3 text-sm text-ink-muted';
          notice.textContent = 'Manager account · read-only access';
          container.prepend(notice);
        });
      }
      return;
    }
  }
  container.innerHTML = '<p class="p-4 text-ink-muted">Page not found.</p>';
}

function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}
