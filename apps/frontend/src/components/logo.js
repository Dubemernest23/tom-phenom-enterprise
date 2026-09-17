export function tpMonogram(className = '') {
  return `
    <svg class="${className}" viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path d="M10 13 H38" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <path d="M24 13 V38" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <path d="M33 13 V40" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <path d="M33 13 C20 13 16 26 33 40" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
    </svg>`;
}

export function wordmark({ tone = 'ink' } = {}) {
  const heading = tone === 'surface' ? 'text-surface' : 'text-ink';
  const sub = tone === 'surface' ? 'text-surface' : 'text-ink-muted';
  return `
    <div class="leading-tight">
      <p class="font-heading text-lg font-bold ${heading}">TOM-PHENOM</p>
      <p class="text-xs font-medium tracking-wordmark ${sub}">ENTERPRISE</p>
    </div>`;
}

export function splashMarkup() {
  return `
    <div class="px-4 pt-24 text-center" role="status" aria-label="Loading">
      <div class="mx-auto inline-block">
        ${tpMonogram('h-12 w-12 text-primary')}
      </div>
      <p class="mt-4 font-heading text-2xl font-bold text-ink">TOM-PHENOM</p>
      <p class="mt-1 text-xs font-medium tracking-wordmark text-ink-muted">ENTERPRISE</p>
    </div>`;
}