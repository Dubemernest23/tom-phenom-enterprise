export function kpiCard({ label, value, valueClass, route, prefix, suffix }) {
  return `
    <a href="${route}" class="block rounded-lg border border-line bg-surface-alt p-4">
      <p class="text-sm font-medium text-ink-muted">${label}</p>
      <p class="mt-1 font-heading text-2xl font-bold tabular-nums ${valueClass || 'text-ink'}">
        ${prefix || ''}${value}${suffix ? ' ' + suffix : ''}
      </p>
    </a>`;
}