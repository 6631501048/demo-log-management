<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="margin:0">Dashboard</h2>
      <span v-if="loading" style="color:var(--text-dim);font-size:13px">Loading...</span>
    </div>

    <FilterBar @apply="onFilterApply" />

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div class="grid-3" style="margin-bottom:16px">
      <BarChart title="Top Source IP" :data="topIpData" />
      <BarChart title="Top User" :data="topUserData" />
      <BarChart title="Top Event Type" :data="topEventTypeData" />
    </div>

    <div style="margin-bottom:16px">
      <TimelineChart title="Events over time" :data="timelineData" />
    </div>

    <LogTable :rows="logs" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import FilterBar from '../components/FilterBar.vue';
import BarChart from '../components/BarChart.vue';
import TimelineChart from '../components/TimelineChart.vue';
import LogTable from '../components/LogTable.vue';
import { api } from '../api';

const loading = ref(false);
const error = ref('');
const logs = ref([]);
const topIpData = ref([]);
const topUserData = ref([]);
const topEventTypeData = ref([]);
const timelineData = ref([]);

let currentFilters = {};

async function loadAll(filters = {}) {
  loading.value = true;
  error.value = '';
  try {
    const [searchRes, summaryRes] = await Promise.all([
      api.searchLogs({ ...filters, limit: 100 }),
      api.summary({ from: filters.from, to: filters.to }),
    ]);
    logs.value = searchRes.results;
    topIpData.value = summaryRes.top_ip.map((r) => ({ label: r.src_ip, value: Number(r.count) }));
    topUserData.value = summaryRes.top_user.map((r) => ({ label: r.user, value: Number(r.count) }));
    topEventTypeData.value = summaryRes.top_event_type.map((r) => ({ label: r.event_type, value: Number(r.count) }));
    timelineData.value = summaryRes.timeline.map((r) => ({
      label: new Date(r.bucket).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
      value: Number(r.count),
    }));
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function onFilterApply(filters) {
  currentFilters = filters;
  loadAll(filters);
}

onMounted(() => loadAll());
</script>
