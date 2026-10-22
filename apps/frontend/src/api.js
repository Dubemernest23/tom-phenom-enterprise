import { API_BASE_URL } from './config.js';
import { getSession, clearSession } from './state.js';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const session = getSession();
  if (session && session.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  let res;
  try {
    res = await fetch(url, config);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Cannot reach the API at ${API_BASE_URL}. Check that the backend is running and that its CORS_ORIGIN matches this page.`);
    }
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearSession();
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

// Builds "?a=1&b=2" from an object, skipping empty values. Returns '' when nothing is left.
const toQuery = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return query ? `?${query}` : '';
};

// Auth
export const login = (credentials) => request('/auth/login', { method: 'POST', body: credentials });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const createPanelUser = (data) => request('/auth/users', { method: 'POST', body: data });

// Roll Intake
// getRollIntakes returns { items, nextCursor }. params: { from, to, limit, cursor }.
export const getRollIntakes = (params) => request(`/roll-intake${toQuery(params)}`);
// getRollIntakeSummary returns the running position with the supplier. params: { from, to }.
export const getRollIntakeSummary = (params) => request(`/roll-intake/summary${toQuery(params)}`);
export const createRollIntake = (data) => request('/roll-intake', { method: 'POST', body: data });

// Packing Bags
export const getPackingBagBatches = () => request('/packing-bags');
export const getPackingBagBatch = (id) => request(`/packing-bags/${id}`);
export const createPackingBagBatch = (data) => request('/packing-bags', { method: 'POST', body: data });
export const usePackingBagBatch = (id, data) => request(`/packing-bags/${id}/use`, { method: 'POST', body: data });

// Factory Log
export const getFactoryLogs = () => request('/factory-log');
export const createFactoryLog = (data) => request('/factory-log', { method: 'POST', body: data });
export const updateFactoryLog = (id, data) => request(`/factory-log/${id}`, { method: 'PATCH', body: data });

// Distribution
export const getDistributions = (channel) => request(`/distribution${channel && channel !== 'all' ? `?channel=${channel}` : ''}`);
export const getDistribution = (id) => request(`/distribution/${id}`);
export const createDistribution = (data) => request('/distribution', { method: 'POST', body: data });
export const updateDistribution = (id, data) => request(`/distribution/${id}`, { method: 'PATCH', body: data });
export const addDistributionTransfer = (id, data) => request(`/distribution/${id}/transfers`, { method: 'POST', body: data });
export const calculateDistribution = (id) => request(`/distribution/${id}/calculate`, { method: 'POST' });

// Customers
export const getCustomers = () => request('/customers');
export const getCustomer = (id) => request(`/customers/${id}`);
export const createCustomer = (data) => request('/customers', { method: 'POST', body: data });
export const addCustomerTransaction = (id, data) => request(`/customers/${id}/transactions`, { method: 'POST', body: data });
export const updateCustomerTransaction = (id, transactionId, data) => request(`/customers/${id}/transactions/${transactionId}`, { method: 'PATCH', body: data });

// Payroll
export const getWorkers = () => request('/payroll');
export const getWorker = (id) => request(`/payroll/${id}`);
export const createWorker = (data) => request('/payroll', { method: 'POST', body: data });
export const addSalaryRecord = (id, data) => request(`/payroll/${id}/records`, { method: 'POST', body: data });
export const updateSalaryRecord = (id, recordId, data) => request(`/payroll/${id}/records/${recordId}`, { method: 'PATCH', body: data });

// Staff
export const getStaff = () => request('/staff');
export const getStaffMember = (id) => request(`/staff/${id}`);
export const createStaffMember = (data) => request('/staff', { method: 'POST', body: data });
export const updateStaffMember = (id, data) => request(`/staff/${id}`, { method: 'PATCH', body: data });
export const saveStaffRating = (id, data) => request(`/staff/${id}/ratings`, { method: 'POST', body: data });

// Government inspections and taxes
export const getInspections = () => request('/inspections');
export const getInspection = (id) => request(`/inspections/${id}`);
export const createInspection = (data) => request('/inspections', { method: 'POST', body: data });
export const updateInspection = (id, data) => request(`/inspections/${id}`, { method: 'PATCH', body: data });
export const getTaxes = () => request('/taxes');
export const getTax = (id) => request(`/taxes/${id}`);
export const createTax = (data) => request('/taxes', { method: 'POST', body: data });
export const updateTax = (id, data) => request(`/taxes/${id}`, { method: 'PATCH', body: data });

// Maintenance
export const getMaintenanceRecords = () => request('/maintenance');
export const createMaintenanceRecord = (data) => request('/maintenance', { method: 'POST', body: data });

// Payables
export const getCreditors = () => request('/payables');
export const getCreditor = (id) => request(`/payables/${id}`);
export const createCreditor = (data) => request('/payables', { method: 'POST', body: data });
export const addPayableTransaction = (id, data) => request(`/payables/${id}/transactions`, { method: 'POST', body: data });

// Dashboard
export const getDashboardSummary = () => request('/dashboard');
