<template>
  <div v-if="$route.name === 'login'">
    <router-view />
  </div>
  <div v-else class="app-shell">
    <aside class="sidebar">
      <h1>Log Management</h1>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/alerts">Alerts</router-link>
      </nav>
      <div class="tenant-badge" v-if="authStore.user">
        {{ authStore.user.email }}<br />
        role: {{ authStore.user.role }}<br />
        tenant: {{ authStore.user.tenant }}<br />
        <a href="#" @click.prevent="logout">Logout</a>
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { authStore, clearAuth } from './store/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
function logout() {
  clearAuth();
  router.push({ name: 'login' });
}
</script>
