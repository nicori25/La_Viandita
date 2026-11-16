<script setup>
import { computed } from "vue";
const props = defineProps({
  title: String,
  subtitle: String,
  unit: String,
  items: Array,
});
const max = computed(() => Math.max(1, ...props.items.map((r) => r.value)));
const empty = computed(() => props.items.every((r) => r.value === 0));
</script>
<template>
  <figure class="card chart-card">
    <figcaption>
      <h2>{{ title }}</h2>
      <p class="muted">{{ subtitle }}</p>
    </figcaption>
    <p v-if="empty" class="chart-empty">Sin movimientos para este período.</p>
    <div v-else class="bar-chart">
      <div v-for="item in items" :key="item.label" class="bar-row">
        <div class="bar-label">
          <span>{{ item.label }}</span
          ><strong>{{ item.display ?? item.value }}</strong>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :class="item.color"
            :style="{ width: (item.value / max) * 100 + '%' }"
          />
        </div>
      </div>
      <div class="chart-axis">
        <span>0</span><span>{{ unit }} · escala desde cero</span>
      </div>
    </div>
  </figure>
</template>
