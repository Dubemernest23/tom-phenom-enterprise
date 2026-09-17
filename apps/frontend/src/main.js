import { initRouter, registerRoute } from './router.js';
import { mountShell } from './components/nav-bar.js';
import * as dashboard from './pages/dashboard.js';
import * as rollIntake from './pages/roll-intake.js';

var app = document.getElementById('app');
var view = mountShell(app);

registerRoute('/', dashboard);
registerRoute('/dashboard', dashboard);
registerRoute('/roll-intake', rollIntake);

initRouter(view);