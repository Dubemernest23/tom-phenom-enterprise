export function attachFormModal(container, form, trigger, title) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4';
  modal.setAttribute('data-form-modal', '');
  modal.innerHTML = `
    <section role="dialog" aria-modal="true" aria-label="${title}" class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-surface p-5 shadow-xl">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="font-heading text-lg font-semibold text-ink">${title}</h2>
        <button type="button" data-modal-close aria-label="Close" class="min-h-11 min-w-11 rounded-lg border border-line px-3 text-xl text-ink">&times;</button>
      </div>
      <div data-form-slot></div>
    </section>`;
  modal.querySelector('[data-form-slot]').append(form);
  form.classList.remove('mt-3', 'mt-4', 'mt-6', 'hidden');
  form.classList.add('flex', 'flex-col', 'gap-4');
  container.append(modal);

  function close() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    trigger.setAttribute('aria-expanded', 'false');
  }
  function open() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    trigger.setAttribute('aria-expanded', 'true');
    const first = form.querySelector('input:not([type="hidden"]),button');
    if (first) first.focus();
  }
  trigger.addEventListener('click', open);
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  modal.querySelector('[data-modal-close]').addEventListener('click', close);
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) close(); });
  return { open, close };
}
