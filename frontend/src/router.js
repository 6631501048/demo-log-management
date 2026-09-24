// frontend/src/router.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { isLoggedIn } from './store/auth';
import LoginView from './views/LoginView.vue';
import DashboardView from './views/DashboardView.vue';
import AlertsView from './views/AlertsView.vue';

const routes = [
  { path: '/login', name: 'login', component: LoginView },
  { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/alerts', name: 'alerts', component: AlertsView, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return { name: 'login' };
  }
  return true;
});

export default router;
