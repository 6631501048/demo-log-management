<template>
  <div class="login-page">
    <form class="login-box card" @submit.prevent="onSubmit">
      <h2 style="margin:0 0 8px">Log Management</h2>
      <input v-model="email" type="email" placeholder="Email" autocomplete="username" required />
      <input v-model="password" type="password" placeholder="Password" autocomplete="current-password" required />
      <button type="submit" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
      <p v-if="error" class="error-msg">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import { setAuth } from '../store/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const router = useRouter();

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const res = await api.login(email.value, password.value);
    setAuth(res.token, res.user);
    router.push({ name: 'dashboard' });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
