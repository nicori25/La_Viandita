<script setup>
import Icon from "./Icon.vue";
defineProps({ desde: String, hasta: String, loading: Boolean, demo: Boolean });
defineEmits(["update:desde", "update:hasta", "apply", "preset"]);
</script>
<template>
  <form class="period-filter no-print" @submit.prevent="$emit('apply')">
    <div class="period-label">
      <Icon name="CalendarDays" :size="20" />
      <div>
        <strong>Período de consulta</strong
        ><small>El filtro actualiza indicadores, gráficos e informe.</small>
      </div>
    </div>
    <div class="period-fields">
      <label
        >Desde<input
          type="date"
          :value="desde"
          @input="$emit('update:desde', $event.target.value)"
          required /></label
      ><span class="muted">—</span
      ><label
        >Hasta<input
          type="date"
          :value="hasta"
          @input="$emit('update:hasta', $event.target.value)"
          required /></label
      ><button class="btn-primary" :disabled="loading">
        <Icon name="RefreshCw" :size="16" />{{
          loading ? "Actualizando…" : "Aplicar"
        }}
      </button>
    </div>
    <div class="quick-periods">
      <button type="button" @click="$emit('preset', 'current')">Este mes</button
      ><button v-if="demo" type="button" @click="$emit('preset', 'demo')">
        Marzo 2026 · ejemplo
      </button>
    </div>
  </form>
</template>
