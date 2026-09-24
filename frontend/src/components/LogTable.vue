<template>
  <div class="card">
    <table>
      <thead>
        <tr>
          <th>Time</th><th>Source</th><th>Event Type</th><th>Severity</th>
          <th>Action</th><th>Src IP</th><th>User</th><th>Host</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ formatTs(row.ts) }}</td>
          <td>{{ row.source }}</td>
          <td>{{ row.event_type || '-' }}</td>
          <td>{{ row.severity ?? '-' }}</td>
          <td><span v-if="row.action" class="badge" :class="row.action">{{ row.action }}</span></td>
          <td>{{ row.src_ip || '-' }}</td>
          <td>{{ row.user || '-' }}</td>
          <td>{{ row.host || '-' }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="rows.length === 0" style="color:var(--text-dim);font-size:13px;margin-top:8px">
      No logs match these filters.
    </p>
  </div>
</template>

<script setup>
defineProps({ rows: { type: Array, default: () => [] } });

function formatTs(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}
</script>
