import { API_BASE_URL } from './config.js';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

// Roll Intake
export const getRollIntakes = () => request('/roll-intake');
export const createRollIntake = (data) => request('/roll-intake', { method: 'POST', body: data });

// Packing Bags
export const getPackingBagBatches = () => request('/packing-bags');
export const createPackingBagBatch = (data) => request('/packing-bags', { method: 'POST', body: data });
export const usePackingBagBatch = (id, data) => request(`/packing-bags/${id}/use`, { method: 'POST', body: data });

// Factory Log
export const getFactoryLogs = () => request('/factory-log');
export const createFactoryLog = (data) => request('/factory-log', { method: 'POST', body: data });

// Distribution
export const getDistributions = (channel) => request(`/distribution${channel && channel !== 'all' ? `?channel=${channel}` : ''}`);
export const createDistribution = (data) => request('/distribution', { method: 'POST', body: data });

// Customers
export const getCustomers = () => request('/customers');
export const getCustomer = (id) => request(`/customers/${id}`);
export const createCustomer = (data) => request('/customers', { method: 'POST', body: data });
export const addCustomerTransaction = (id, data) => request(`/customers/${id}/transactions`, { method: 'POST', body: data });

// Payroll
export const getWorkers = () => request('/payroll');
export const getWorker = (id) => request(`/payroll/${id}`);
export const createWorker = (data) => request('/payroll', { method: 'POST', body: data });
export const addSalaryRecord = (id, data) => request(`/payroll/${id}/records`, { method: 'POST', body: data });

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
