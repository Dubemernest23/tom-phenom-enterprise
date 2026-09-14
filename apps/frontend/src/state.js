const state = {
  dashboardSummary: null,
};

export function setDashboardSummary(data) {
  state.dashboardSummary = data;
}

export function getDashboardSummary() {
  return state.dashboardSummary;
}

export function clearState() {
  state.dashboardSummary = null;
}
