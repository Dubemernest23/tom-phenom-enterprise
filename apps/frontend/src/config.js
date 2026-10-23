// Keep local development pointed at the machine serving the page. Production
// builds replace this module with the configured API_BASE_URL.
export const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:4000/api`;
