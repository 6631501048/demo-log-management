// frontend/src/api.js
import { authStore, clearAuth } from './store/auth';

/**
 * @param {string} path - e.g. "/logs?source=ad"
 * @param {RequestInit} [opts]
 */
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`;
  }
  const res = await fetch(path, { ...opts, headers });

  if (res.status === 401) {
    // Token missing/expired/invalid — force back to login.
    clearAuth();
    window.location.hash = '#/login';
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  searchLogs: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    );
    return apiFetch(`/logs?${qs.toString()}`);
  },

  summary: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    );
    return apiFetch(`/logs/summary?${qs.toString()}`);
  },
};
