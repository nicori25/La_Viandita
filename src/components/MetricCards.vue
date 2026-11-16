<script setup>
import Icon from "./Icon.vue";
defineProps({ cards: Array });
</script>
<template>
  <div class="metric-grid">
    <article v-for="card in cards" :key="card.title" class="metric-card">
      <div class="metric-top">
        <span>{{ card.title }}</span
        ><span class="metric-icon"><Icon :name="card.icon" :size="19" /></span>
      </div>
      <div class="metric-value">
        {{ card.valor === null ? "—" : card.valor.toLocaleString("es-AR")
        }}<small v-if="card.valor !== null">{{ card.unit }}</small>
      </div>
      <div class="metric-goal">{{ card.goal }}</div>
      <span class="status-pill" :class="card.estado"
        ><span class="status-dot" />{{ card.etiqueta }}</span
      >
      <p>{{ card.detail }}</p>
    </article>
  </div>
</template>
