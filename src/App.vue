<template>
  <div class="min-h-screen">
    <!-- Barra superior -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-2">
            <span class="text-xl font-bold text-blue-700">🥪</span>
            <span class="font-bold text-gray-800">La Viandita</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 hidden sm:block">
              Rol: {{ currentRole }}
            </span>
            <button
              @click="cerrarSesion"
              class="btn-secondary text-sm"
            >
              Cambiar rol
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mensaje de datos de prueba (solo en modo simulación) -->
    <div v-if="!usandoSupabase" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <!-- Contenido principal -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Pie de página -->
    <footer class="border-t border-gray-200 bg-white mt-auto py-4">
      <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        La Viandita - Precooperativa escolar &bull; Sebastián Lopez y Ariel Aranda, 7°3
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const currentRole = computed(() => authStore.role)
const usandoSupabase = computed(() => authStore.usingSupabase)

// Inicializar autenticación: verificar sesión de Supabase o modo simulado
onMounted(async () => {
  await authStore.inicializar()
})

function cerrarSesion() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
