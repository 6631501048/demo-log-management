<template>
  <div class="card">
    <h3 style="margin:0 0 12px;font-size:14px;color:var(--text-dim)">{{ title }}</h3>
    <canvas ref="canvasEl" height="180"></canvas>
    <p v-if="!hasData" style="color:var(--text-dim);font-size:13px">No data</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
  title: { type: String, required: true },
  // [{ label: string, value: number }]
  data: { type: Array, default: () => [] },
});

const canvasEl = ref(null);
let chart = null;
const hasData = computed(() => props.data.length > 0);

function render() {
  if (!canvasEl.value) return;
  const labels = props.data.map((d) => d.label);
  const values = props.data.map((d) => d.value);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.update();
    return;
  }

  chart = new Chart(canvasEl.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: '#4c8dff' }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9aa3b8' }, grid: { color: '#2a3145' } },
        y: { ticks: { color: '#9aa3b8' }, grid: { color: '#2a3145' }, beginAtZero: true },
      },
    },
  });
}

onMounted(render);
watch(() => props.data, render, { deep: true });
onBeforeUnmount(() => chart?.destroy());
</script>
