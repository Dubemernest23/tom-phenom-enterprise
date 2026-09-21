export function listRow(cells, options) {
  const href = options && options.href;
  const Tag = href ? 'a' : 'div';
  const hrefAttr = href ? `href="${href}"` : '';
  const wrapClass = href ? 'hover:bg-surface-alt' : '';

  return `
    <${Tag} ${hrefAttr} class="flex items-baseline gap-3 border-b border-line px-4 py-3 ${wrapClass}">
      ${cells.map(function (c) {
        return `<span class="min-w-0 flex-1 text-sm tabular-nums ${c.className || 'text-ink'}">${c.value}</span>`;
      }).join('')}
    </${Tag}>`;
}

export function stackedRow({ primary, secondary, value, valueClass }) {
  return `
    <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-ink">${primary}</p>
        ${secondary ? `<p class="mt-0.5 text-xs text-ink-muted">${secondary}</p>` : ''}
      </div>
      <p class="shrink-0 text-sm font-semibold tabular-nums ${valueClass || 'text-ink'}">${value}</p>
    </div>`;
}