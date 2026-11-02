<template>
  <div v-if="visible" :class="['alert', `alert-${tipo}`]" role="alert">
    {{ mensaje }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  tipo: { type: String, default: 'info' },
  mensaje: { type: String, required: true },
  visible: { type: Boolean, default: true },
})

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
</script>
