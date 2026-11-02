<template>
  <div class="flex flex-col items-center justify-center py-8">
    <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
    <p class="text-sm text-gray-600">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  mensaje: { type: String, default: 'Cargando...' },
})

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
</script>
