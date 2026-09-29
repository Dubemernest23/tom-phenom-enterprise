import { tpMonogram, wordmark, splashMarkup } from './logo.js';
import { clearSession } from '../state.js';

function svg(cls, inner) {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

const I = {
  dashboard: (c) => svg(c, '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  roll: (c) => svg(c, '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>'),
  bag: (c) => svg(c, '<path d="M6 8h12l-1.5 12.5h-9L6 8z"/><path d="M9 8c0-2 1-3 3-3s3 1 3 3"/>'),
  clipboard: (c) => svg(c, '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 11h6M9 15h6"/>'),
  truck: (c) => svg(c, '<path d="M3 7h10v9H3z"/><path d="M13 10h3.5L20 13.5V16h-7z"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/>'),
  person: (c) => svg(c, '<circle cx="12" cy="8" r="3.2"/><path d="M5 20c1-3.2 3.6-5 7-5s6 1.8 7 5"/>'),
  naira: (c) => svg(c, '<path d="M8 3v18"/><path d="M16 3v18"/><path d="M6 9h12"/><path d="M6 15h12"/>'),
  wrench: (c) => svg(c, '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
  ledger: (c) => svg(c, '<path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z"/><path d="M6 4v16"/><path d="M9 8h5M9 12h5"/>'),
  factory: (c) => svg(c, '<path d="M3 21V10l5 4v-4l5 4v-4l5 4v7z"/><path d="M3 21h18"/>'),
  more: (c) => `<svg class="${c}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>`,
  menu: (c) => `<svg class="${c}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>`,
};

const SIDEBAR_ITEMS = [
  { route: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { route: '/roll-intake', label: 'Roll Intake', icon: 'roll' },
  { route: '/packing-bags', label: 'Packing Bags', icon: 'bag' },
  { route: '/factory-log', label: 'Factory Log', icon: 'clipboard' },
  { route: '/distribution', label: 'Distribution', icon: 'truck' },
  { route: '/customers', label: 'Customers', icon: 'person' },
  { route: '/payroll', label: 'Payroll', icon: 'naira' },
  { route: '/maintenance', label: 'Maintenance', icon: 'wrench' },
  { route: '/payables', label: 'Payables', icon: 'ledger' },
];

const GROUP_PATHS = {
  factory: ['/roll-intake', '/packing-bags', '/factory-log'],
  money: ['/customers', '/payables'],
  more: ['/distribution', '/payroll', '/maintenance'],
};

const GROUPS = Object.fromEntries(
  Object.entries(GROUP_PATHS).map(([id, routes]) => [
    id,
    {
      label: id.charAt(0).toUpperCase() + id.slice(1),
      items: SIDEBAR_ITEMS.filter((item) => routes.includes(item.route)),
    },
  ]),
);

const TAB_ORDER = ['dashboard', 'factory', 'money', 'more'];

const TABS = {
  dashboard: { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  factory: { label: 'Factory', icon: 'factory', group: 'factory' },
  money: { label: 'Money', icon: 'naira', group: 'money' },
  more: { label: 'More', icon: 'more', group: 'more' },
};

function tabButton(id) {
  const tab = TABS[id];
  return `
    <button type="button" data-tab="${id}" ${tab.route ? `data-route="${tab.route}"` : `data-group="${tab.group}"`}
      class="flex min-h-11 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent px-2 pt-2 text-xs font-medium text-ink-muted">
      <span class="shrink-0">${I[tab.icon]('h-6 w-6')}</span>
      ${tab.label}
    </button>`;
}

function sidebarLink(item) {
  return `
    <a href="#${item.route}" data-sidebar-route="${item.route}"
      class="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium text-ink-muted hover:bg-surface-alt">
      <span class="shrink-0">${I[item.icon]('h-6 w-6')}</span>
      ${item.label}
    </a>`;
}

export function mountShell(app) {
  const shell = document.createElement('div');
  shell.className = 'app-shell min-h-screen bg-surface text-ink';
  shell.innerHTML = `
    <aside class="app-chrome fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r border-line bg-surface md:flex" aria-label="Sidebar">
      <nav class="flex-1 overflow-y-auto p-2 pt-3">
        ${SIDEBAR_ITEMS.map(sidebarLink).join('')}
      </nav>
    </aside>

    <div class="app-content min-h-screen md:pl-56">
      <header class="app-chrome sticky top-0 z-20 flex items-center gap-3 bg-primary px-4 py-3 shadow-header">
        <a href="#/dashboard" aria-label="TOM-PHENOM ENTERPRISE home">
          ${tpMonogram('h-9 w-9 shrink-0 text-surface')}
        </a>
        ${wordmark({ tone: 'surface' })}
        <button type="button" id="app-menu" aria-label="Open menu"
          class="ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-surface hover:bg-primary-dark">
          ${I.menu('h-6 w-6')}
        </button>
      </header>

      <main id="view" class="app-main mx-auto w-full max-w-3xl px-4 pb-28 pt-6 md:px-6 md:pb-10 md:pt-8"></main>
    </div>

    <nav class="app-chrome fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface md:hidden" aria-label="Primary">
      <div class="grid grid-cols-4">
        ${TAB_ORDER.map(tabButton).join('')}
      </div>
    </nav>
  `;

  app.replaceChildren(shell);

  const view = shell.querySelector('#view');
  view.innerHTML = splashMarkup();
  wire(shell);

  return view;
}

function wire(shell) {
  const tabBar = shell.querySelector('nav[aria-label="Primary"]');
  const menuBtn = shell.querySelector('#app-menu');

  tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    if (btn.dataset.route) {
      window.location.hash = btn.dataset.route;
      return;
    }
    const group = GROUPS[btn.dataset.group];
    if (group) {
      showSheet({
        title: group.label,
        sections: [{ label: null, items: group.items }],
      });
    }
  });

  menuBtn.addEventListener('click', () => {
    showSheet({
      title: 'Menu',
      showSignOut: true,
      sections: [
        { label: null, items: [{ route: '/dashboard', label: 'Dashboard', icon: 'dashboard' }] },
        { label: 'Factory', items: GROUPS.factory.items },
        { label: 'Money', items: GROUPS.money.items },
        { label: 'More', items: GROUPS.more.items },
      ],
    });
  });

  window.addEventListener('hashchange', () => updateActive(shell));
  updateActive(shell);
}

function showSheet({ title, sections, showSignOut }) {
  const opener = document.activeElement;
  const sheet = document.createElement('div');
  sheet.className = 'fixed inset-0 z-30';
  sheet.innerHTML = `
    <div class="absolute inset-0 bg-overlay" data-sheet-backdrop></div>
    <div class="absolute inset-x-0 bottom-0 max-h-screen overflow-y-auto rounded-t-xl bg-surface p-2 pb-4" role="dialog" aria-modal="true" aria-label="${title}">
      <p class="px-3 pb-1 pt-2 font-heading text-xl font-semibold text-ink">${title}</p>
      ${sections.map((section) => `
        <div class="mt-1">
          ${section.label ? `<p class="px-3 pb-1 pt-2 text-sm font-medium text-ink-muted">${section.label}</p>` : ''}
          ${section.items.map((item) => `
            <a href="#${item.route}" data-sheet-link="${item.route}"
              class="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-lg font-medium text-ink hover:bg-surface-alt">
              <span class="shrink-0">${I[item.icon]('h-6 w-6 text-primary')}</span>
              ${item.label}
            </a>`).join('')}
        </div>`).join('')}
      ${showSignOut ? `
        <button type="button" data-signout
          class="mt-1 flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-left text-lg font-medium text-debt hover:bg-surface-alt">
          Sign out
        </button>` : ''}
    </div>`;

  document.body.appendChild(sheet);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    sheet.remove();
    document.removeEventListener('keydown', onKey);
    if (opener && typeof opener.focus === 'function') opener.focus();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };

  document.addEventListener('keydown', onKey);
  sheet.querySelector('[data-sheet-backdrop]').addEventListener('click', close);
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('[data-signout]')) {
      clearSession();
      window.location.hash = '#/login';
      close();
      return;
    }
    if (e.target.closest('[data-sheet-link]')) close();
  });
  const firstItem = sheet.querySelector('[data-sheet-link]');
  if (firstItem) firstItem.focus();
}

function normalizePath(hash) {
  const path = (hash || '#/').slice(1) || '/';
  return path === '/' ? '/dashboard' : path;
}

function tabForPath(path) {
  if (path === '/dashboard') return 'dashboard';
  for (const [id, routes] of Object.entries(GROUP_PATHS)) {
    if (routes.includes(path)) return id;
  }
  return null;
}

function updateActive(shell) {
  const path = normalizePath(window.location.hash);
  const activeTab = tabForPath(path);

  shell.querySelectorAll('[data-tab]').forEach((btn) => {
    const on = btn.dataset.tab === activeTab;
    btn.classList.toggle('text-primary', on);
    btn.classList.toggle('border-primary', on);
    btn.classList.toggle('text-ink-muted', !on);
    btn.classList.toggle('border-transparent', !on);
    if (on) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });

  shell.querySelectorAll('[data-sidebar-route]').forEach((link) => {
    const on = link.dataset.sidebarRoute === path;
    link.classList.toggle('bg-surface-alt', on);
    link.classList.toggle('text-ink', on);
    link.classList.toggle('font-medium', on);
    link.classList.toggle('text-ink-muted', !on);
    if (on) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}