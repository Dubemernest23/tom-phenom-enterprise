const SESSION_KEY = 'tpe:session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (err) {
    return null;
  }
}

const state = {
  dashboardSummary: null,
  session: readSession(),
};

export function setDashboardSummary(data) {
  state.dashboardSummary = data;
}

export function getDashboardSummary() {
  return state.dashboardSummary;
}

export function setSession(session) {
  state.session = session;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession() {
  return state.session;
}

export function isAuthenticated() {
  return state.session != null;
}

export function clearSession() {
  setSession(null);
  state.dashboardSummary = null;
}

export function clearState() {
  state.dashboardSummary = null;
}
