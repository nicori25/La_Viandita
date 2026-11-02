<template>
  <div class="card">
    <div class="datos-prueba" v-if="modoPrueba">Datos de prueba</div>
    <h3 class="text-sm font-semibold text-gray-500 mb-1">{{ titulo }}</h3>
    <div class="flex items-baseline gap-2 mb-2">
      <span class="text-2xl font-bold text-gray-900">{{ valor }}</span>
      <span v-if="meta !== null" class="text-sm text-gray-500">Meta: {{ meta }}</span>
    </div>
    <span class="badge-meta" :class="claseColor">{{ etiqueta }}</span>
    <p v-if="subtitulo" class="text-xs text-gray-500 mt-1">{{ subtitulo }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  titulo: { type: String, required: true },
  valor: { type: [Number, String], required: true },
  meta: { type: [Number, String], default: null },
  estado: { type: String, required: true }, // 'verde' | 'amarillo' | 'rojo'
  etiqueta: { type: String, required: true },
  subtitulo: { type: String, default: '' },
})

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)

const claseColor = computed(() => {
  return {
    verde: 'badge-verde',
    amarillo: 'badge-amarillo',
    rojo: 'badge-rojo',
  }[props.estado] || 'badge-rojo'
})
</script>
