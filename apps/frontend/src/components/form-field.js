export function formField({ name, label, type, inputmode, value, required, min, step, placeholder }) {
  const inputType = type || 'text';
  const isRequired = required !== false;
  return `
    <div class="flex flex-col gap-1.5">
      <label for="${name}" class="text-sm font-medium text-ink">${label}</label>
      <input
        type="${inputType}"
        id="${name}"
        name="${name}"
        ${inputmode ? `inputmode="${inputmode}"` : ''}
        ${value !== undefined ? `value="${value}"` : ''}
        ${isRequired ? 'required' : ''}
        ${min !== undefined ? `min="${min}"` : ''}
        ${step ? `step="${step}"` : ''}
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-primary"
      />
    </div>`;
}