import { getStaff, getStaffMember, createStaffMember, updateStaffMember, saveStaffRating } from '../api.js';
import { formField } from '../components/form-field.js';
import { attachFormModal } from '../components/form-modal.js';
import { listRow, stackedRow } from '../components/list-row.js';
import { escapeHtml, formatDate, formatNaira, todayISO } from '../utils.js';

export async function render(container, params) {
  return params && params.id ? renderDetail(container, params.id) : renderList(container);
}

function healthSelect(name, label, value = 'not_tested') {
  return `<div class="flex flex-col gap-1.5"><label for="${name}" class="text-sm font-medium text-ink">${label}</label><select id="${name}" name="${name}" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="not_tested" ${value === 'not_tested' ? 'selected' : ''}>Not tested</option><option value="negative" ${value === 'negative' ? 'selected' : ''}>Negative</option><option value="positive" ${value === 'positive' ? 'selected' : ''}>Positive</option></select></div>`;
}

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
function stateOriginSelect(value = '') {
  return `<div class="flex flex-col gap-1.5"><label for="state_of_origin" class="text-sm font-medium text-ink">State of origin</label><select id="state_of_origin" name="state_of_origin" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="">Select state</option>${NIGERIAN_STATES.map((state) => `<option value="${state}" ${value === state ? 'selected' : ''}>${state}</option>`).join('')}</select></div>`;
}

function staffForm(person) {
  return `
    ${formField({ name: 'name', label: 'Full name', value: person?.name || '' })}
    ${formField({ name: 'role', label: 'Role', value: person?.role || '', required: false })}
    ${formField({ name: 'start_date', label: 'Start date', type: 'date', value: person?.start_date || todayISO() })}
    ${stateOriginSelect(person?.state_of_origin || '')}
    <div class="flex flex-col gap-1.5"><label for="salary_frequency" class="text-sm font-medium text-ink">Pay arrangement</label><select id="salary_frequency" name="salary_frequency" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink"><option value="monthly" ${person?.salary_frequency === 'monthly' || !person ? 'selected' : ''}>Monthly salaried</option><option value="weekly" ${person?.salary_frequency === 'weekly' ? 'selected' : ''}>Weekly full-time · pay based on work done</option><option value="daily" ${person?.salary_frequency === 'daily' ? 'selected' : ''}>Daily on-call · pay per workday</option></select></div>
    <div data-base-salary-field>${formField({ name: 'base_salary', label: 'Monthly salary', type: 'number', inputmode: 'decimal', min: 0, step: '0.01', value: person?.base_salary ?? '' })}<p class="text-xs text-ink-muted">Weekly and daily workers have no fixed base salary. Enter their earnings in each work period.</p></div>
    <h3 class="border-b border-line pb-2 pt-2 font-heading font-semibold text-ink">Health screening</h3>
    <p class="text-xs text-ink-muted">Restrict access to this sensitive information to authorized administrators.</p>
    ${healthSelect('rvs_status', 'RVS test', person?.rvs_status)}
    ${healthSelect('hepatitis_b_status', 'Hepatitis B', person?.hepatitis_b_status)}
    ${healthSelect('hepatitis_c_status', 'Hepatitis C', person?.hepatitis_c_status)}
    ${healthSelect('vdrl_status', 'VDRL', person?.vdrl_status)}
    ${formField({ name: 'genotype', label: 'Genotype', value: person?.genotype || '', required: false, placeholder: 'e.g. AA' })}
    ${formField({ name: 'blood_group', label: 'Blood group', value: person?.blood_group || '', required: false, placeholder: 'e.g. O+' })}
    <button type="submit" class="min-h-11 w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-surface">${person ? 'Save staff details' : 'Add staff member'}</button>`;
}

function readStaffForm(form) {
  const fd = new FormData(form);
  return {
    name: String(fd.get('name') || '').trim(), role: String(fd.get('role') || '').trim() || null,
    start_date: fd.get('start_date'), salary_frequency: fd.get('salary_frequency'),
    base_salary: fd.get('base_salary') === '' ? null : Number(fd.get('base_salary')),
    state_of_origin: String(fd.get('state_of_origin') || '').trim() || null,
    rvs_status: fd.get('rvs_status'), hepatitis_b_status: fd.get('hepatitis_b_status'),
    hepatitis_c_status: fd.get('hepatitis_c_status'), vdrl_status: fd.get('vdrl_status'),
    genotype: String(fd.get('genotype') || '').trim() || null,
    blood_group: String(fd.get('blood_group') || '').trim() || null,
  };
}

function configurePayArrangement(form) {
  if (!form) return;
  const select = form.elements.salary_frequency;
  const salaryField = form.querySelector('[data-base-salary-field]');
  const salaryInput = form.elements.base_salary;
  const update = () => {
    const monthly = select.value === 'monthly';
    salaryField.hidden = !monthly;
    salaryInput.required = monthly;
    if (!monthly) salaryInput.value = '';
  };
  select.addEventListener('change', update);
  update();
}

async function renderList(container) {
  container.innerHTML = `
    <div class="flex items-center justify-between gap-3"><h1 class="font-heading text-xl font-semibold text-ink">Staffing</h1><button id="add-staff" type="button" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface">+ Add staff</button></div>
    <form id="staff-form" class="hidden flex-col gap-4">${staffForm(null)}</form>
    <div id="staff-message" class="mt-3"></div><div id="staff-list" class="mt-3"></div>`;
  const form = container.querySelector('#staff-form');
  const list = container.querySelector('#staff-list');
  const modal = attachFormModal(container, form, container.querySelector('#add-staff'), 'Add staff member');
  configurePayArrangement(form);
  async function reload() {
    list.innerHTML = '<p class="py-3 text-ink-muted">Loading staff...</p>';
    try {
      const staff = await getStaff();
      list.innerHTML = staff.length ? staff.map((person) => listRow([
        { value: escapeHtml(person.name), className: 'font-medium text-ink' },
        { value: escapeHtml(person.role || '—'), className: 'text-ink-muted' },
        { value: `${escapeHtml(person.state_of_origin || 'State not set')} · ${person.salary_frequency === 'monthly' ? formatNaira(person.base_salary) : person.salary_frequency === 'weekly' ? 'Weekly, variable pay' : 'Daily on-call'}`, className: 'text-ink' },
        { value: person.latest_rating ? `${person.latest_rating.rating} / 5 · ${String(person.latest_rating.rating_month).slice(0, 7)}` : 'Not rated', className: 'text-ink-muted' },
        { value: person.next_pay_label || (Number(person.balance) > 0 ? `Salary due ${formatNaira(person.balance)}` : `Started ${formatDate(person.start_date)}`), className: Number(person.balance) > 0 ? 'font-semibold text-warning' : 'text-ink-muted' },
      ], { href: `#/staff/${person.id}` })).join('') : '<p class="py-3 text-ink-muted">No staff records yet.</p>';
    } catch (err) { list.innerHTML = `<p class="py-3 text-debt">${escapeHtml(err.message)}</p>`; }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await createStaffMember(readStaffForm(form));
      container.querySelector('#staff-message').innerHTML = '<p class="text-positive">Staff member added.</p>';
      form.reset(); modal.close(); await reload();
    } catch (err) { container.querySelector('#staff-message').innerHTML = `<p class="text-debt">${escapeHtml(err.message)}</p>`; }
  });
  await reload();
}

async function renderDetail(container, id) {
  container.innerHTML = '<p class="py-4 text-ink-muted">Loading staff profile...</p>';
  let person;
  try { person = await getStaffMember(id); }
  catch (err) { container.innerHTML = `<p class="py-4 text-debt">${escapeHtml(err.message)}</p>`; return; }
  container.innerHTML = `
    <p class="text-sm text-ink-muted"><a href="#/staff" class="text-primary">Staffing</a> / ${escapeHtml(person.name)}</p>
    <div class="mt-1 flex flex-wrap items-center justify-between gap-3"><h1 class="font-heading text-xl font-semibold text-ink">${escapeHtml(person.name)}</h1><button type="button" id="edit-staff" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">Edit profile</button></div>
    <p class="mt-1 text-sm text-ink-muted">${escapeHtml(person.role || '—')} · ${escapeHtml(person.state_of_origin || 'State not set')} · Started ${formatDate(person.start_date)} · ${person.salary_frequency === 'monthly' ? `Monthly salary ${formatNaira(person.base_salary)}` : person.salary_frequency === 'weekly' ? 'Weekly full-time · variable pay' : 'Daily on-call · paid per workday'} · Next pay: ${escapeHtml(person.next_pay_label || 'Schedule not set')}</p>
    <form id="staff-edit-form" class="hidden flex-col gap-4">${staffForm(person)}</form>
    <section class="mt-6 rounded-lg border border-line p-4"><h2 class="font-heading text-lg font-semibold text-ink">Health screening</h2><p class="mt-1 text-xs text-ink-muted">Sensitive staff information</p><div class="mt-3 grid grid-cols-2 gap-3 text-sm">${[['RVS', person.rvs_status], ['Hepatitis B', person.hepatitis_b_status], ['Hepatitis C', person.hepatitis_c_status], ['VDRL', person.vdrl_status], ['Genotype', person.genotype], ['Blood group', person.blood_group]].map(([label, value]) => `<p class="text-ink-muted">${label}: <span class="font-medium text-ink">${escapeHtml(value || '—')}</span></p>`).join('')}</div></section>
    <section class="mt-6"><div class="flex items-center justify-between gap-2"><h2 class="font-heading text-lg font-semibold text-ink">Monthly rating</h2><button type="button" id="add-rating" class="min-h-11 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">+ Rate month</button></div>
    <form id="rating-form" class="hidden flex-col gap-4">${formField({ name: 'rating_month', label: 'Month', type: 'date', value: `${todayISO().slice(0, 7)}-01` })}<div class="flex flex-col gap-1.5"><label for="rating" class="text-sm font-medium text-ink">Rating (1 to 5)</label><select name="rating" id="rating" class="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base text-ink">${[5,4,3,2,1].map((n)=>`<option value="${n}">${n} / 5</option>`).join('')}</select></div>${formField({ name: 'note', label: 'Note', required: false })}<button type="submit" class="min-h-11 rounded-lg bg-primary px-4 py-2 text-surface">Save rating</button></form>
    <div id="rating-list" class="mt-3"></div></section>
    <a href="#/payroll/${person.id}" class="mt-6 inline-flex min-h-11 items-center rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">Open salary history and payments</a>`;

  const editForm = container.querySelector('#staff-edit-form');
  configurePayArrangement(editForm);
  const editModal = attachFormModal(container, editForm, container.querySelector('#edit-staff'), 'Edit staff profile');
  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try { await updateStaffMember(id, readStaffForm(editForm)); await renderDetail(container, id); }
    catch (err) { editForm.insertAdjacentHTML('afterbegin', `<p class="text-debt">${escapeHtml(err.message)}</p>`); }
  });

  const ratingForm = container.querySelector('#rating-form');
  const ratingList = container.querySelector('#rating-list');
  const ratingModal = attachFormModal(container, ratingForm, container.querySelector('#add-rating'), 'Add or update monthly rating');
  const renderRatings = (items) => { ratingList.innerHTML = items.length ? items.map((rating) => stackedRow({ primary: formatDate(rating.rating_month), secondary: escapeHtml(rating.note || ''), value: `${rating.rating} / 5`, valueClass: 'text-ink' })).join('') : '<p class="py-3 text-sm text-ink-muted">No ratings recorded.</p>'; };
  renderRatings(person.ratings || []);
  ratingForm.addEventListener('submit', async (event) => {
    event.preventDefault(); const fd = new FormData(ratingForm);
    try {
      const record = await saveStaffRating(id, { rating_month: fd.get('rating_month'), rating: Number(fd.get('rating')), note: String(fd.get('note') || '').trim() || null });
      const ratings = [record, ...(person.ratings || []).filter((item) => item.rating_month !== record.rating_month)];
      person.ratings = ratings; renderRatings(ratings); ratingModal.close();
    } catch (err) { ratingForm.insertAdjacentHTML('afterbegin', `<p class="text-debt">${escapeHtml(err.message)}</p>`); }
  });
}
