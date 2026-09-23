<template>
  <div>
    <h2 style="margin-top:0">Alerts</h2>

    <div class="card" v-if="notReady">
      <p style="color:var(--text-dim);margin:0">
        Alert backend endpoint (<code>GET /alerts</code>) ยังไม่ถูกสร้าง —
        จะต่อใน Phase 5 (Alerting). หน้านี้พร้อมใช้งานแล้ว รอแค่ API
      </p>
    </div>

    <div class="card" v-else>
      <table>
        <thead>
          <tr><th>Triggered</th><th>Rule</th><th>Details</th><th>Notified</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in alerts" :key="a.id">
            <td>{{ new Date(a.triggered_at).toLocaleString() }}</td>
            <td>{{ a.rule_name }}</td>
            <td>{{ JSON.stringify(a.details) }}</td>
            <td>
              <span class="badge" :class="a.notified ? 'allow' : 'deny'">
                {{ a.notified ? 'sent' : 'pending' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="alerts.length === 0" style="color:var(--text-dim);font-size:13px">No alerts fired yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';

const alerts = ref([]);
const notReady = ref(false);

onMounted(async () => {
  if (typeof api.getAlerts !== 'function') {
    notReady.value = true;
    return;
  }
  try {
    const res = await api.getAlerts();
    alerts.value = res?.results || [];
  } catch {
    notReady.value = true;
  }
});
</script>
