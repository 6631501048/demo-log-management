// frontend/src/store/auth.js
import { reactive } from 'vue';

const STORAGE_KEY = 'logmgmt_auth';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export const authStore = reactive(loadInitial());

export function setAuth(token, user) {
  authStore.token = token;
  authStore.user = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function clearAuth() {
  authStore.token = null;
  authStore.user = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn() {
  return !!authStore.token;
}
