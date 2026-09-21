export function formatNaira(amount) {
  return '\u20A6' + Number(amount || 0).toLocaleString('en-NG');
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-NG');
}

export function formatKg(kg) {
  return Number(kg || 0).toLocaleString('en-NG', { maximumFractionDigits: 1 }) + ' kg';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}