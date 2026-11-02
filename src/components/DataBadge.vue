<template>
  <span class="badge-meta" :class="claseColor">{{ texto }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  estado: { type: String, required: true },
})

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)

const texto = computed(() => {
  const map = {
    activa: 'Activa',
    baja: 'Baja',
    cumplida: 'Cumplida',
    pendiente: 'Pendiente',
    ingreso: 'Ingreso',
    egreso: 'Egreso',
    dentro: 'Dentro de franja',
    fuera: 'Fuera de franja',
  }
  return map[props.estado] || props.estado
})

const claseColor = computed(() => {
  const map = {
    activa: 'badge-verde',
    baja: 'badge-rojo',
    cumplida: 'badge-verde',
    pendiente: 'badge-amarillo',
    ingreso: 'badge-verde',
    egreso: 'badge-rojo',
    dentro: 'badge-verde',
    fuera: 'badge-rojo',
  }
  return map[props.estado] || 'badge-rojo'
})
</script>
