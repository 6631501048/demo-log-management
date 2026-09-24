<template>
  <div class="filter-bar">
    <select v-model="local.source">
      <option value="">All sources</option>
      <option v-for="s in sources" :key="s" :value="s">{{ s }}</option>
    </select>

    <input v-model="local.event_type" type="text" placeholder="event_type" />

    <select v-model="local.severity_min">
      <option value="">Any severity</option>
      <option v-for="n in [1,3,5,7,9]" :key="n" :value="n">≥ {{ n }}</option>
    </select>

    <input v-model="local.from" type="datetime-local" title="from" />
    <input v-model="local.to" type="datetime-local" title="to" />

    <input v-model="local.q" type="text" placeholder="search raw..." />

    <button @click="emitApply">Apply</button>
    <button type="button" @click="reset" style="background:var(--border)">Reset</button>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const emit = defineEmits(['apply']);

const sources = ['firewall', 'network', 'api', 'crowdstrike', 'aws', 'm365', 'ad'];

const local = reactive({
  source: '', event_type: '', severity_min: '', from: '', to: '', q: '',
});

function emitApply() {
  // datetime-local has no timezone suffix — treat as UTC-ish for the demo scope.
  const payload = { ...local };
  if (payload.from) payload.from = new Date(payload.from).toISOString();
  if (payload.to) payload.to = new Date(payload.to).toISOString();
  emit('apply', payload);
}

function reset() {
  Object.assign(local, { source: '', event_type: '', severity_min: '', from: '', to: '', q: '' });
  emitApply();
}
</script>
