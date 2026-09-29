const routes = {};
let guard = null;

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
      module.render(container, params);
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
