<template>
  <div class="text-center py-12">
    <p class="text-gray-500">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  mensaje: { type: String, default: 'No hay datos disponibles.' },
})

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
</script>
