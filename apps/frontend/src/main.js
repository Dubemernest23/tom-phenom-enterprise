import { initRouter, registerRoute, setRouteGuard } from './router.js';
import { mountShell } from './components/nav-bar.js';
import { isAuthenticated } from './state.js';
import * as dashboard from './pages/dashboard.js';
import * as rollIntake from './pages/roll-intake.js';
import * as packingBags from './pages/packing-bags.js';
import * as factoryLog from './pages/factory-log.js';
import * as distribution from './pages/distribution.js';
import * as customers from './pages/customers.js';
import * as payroll from './pages/payroll.js';
import * as maintenance from './pages/maintenance.js';
import * as payables from './pages/payables.js';
import * as loginPage from './pages/login.js';

var app = document.getElementById('app');
var view = mountShell(app);
var shell = view.closest('.app-shell');

function setAuthChrome(isAuth) {
  shell.classList.toggle('is-auth', isAuth);
}

registerRoute('/', dashboard);
registerRoute('/dashboard', dashboard);
registerRoute('/roll-intake', rollIntake);
registerRoute('/packing-bags', packingBags);
registerRoute('/factory-log', factoryLog);
registerRoute('/distribution', distribution);
registerRoute('/customers', customers);
registerRoute('/customers/:id', customers);
registerRoute('/payroll', payroll);
registerRoute('/payroll/:id', payroll);
registerRoute('/maintenance', maintenance);
registerRoute('/payables', payables);
registerRoute('/payables/:id', payables);
registerRoute('/login', loginPage);

setRouteGuard(function (path) {
  if (path === '/login') {
    if (isAuthenticated()) {
      window.location.hash = '#/dashboard';
      return false;
    }
    setAuthChrome(true);
    return true;
  }
  if (!isAuthenticated()) {
    window.location.hash = '#/login';
    return false;
  }
  setAuthChrome(false);
  return true;
});

initRouter(view);