<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="bg-white rounded-lg shadow-xl p-8 md:p-12 w-full max-w-md">
      <div class="text-center mb-8">
        <span class="text-4xl">🥪</span>
        <h1 class="text-2xl font-bold text-gray-800 mt-2">La Viandita</h1>
        <p class="text-sm text-gray-500">Precooperativa escolar - Ingreso</p>
      </div>

      <!-- Advertencia de modo prueba -->
      <div v-if="modoPrueba" class="datos-prueba mb-6">
        ⚠️ Modo datos de prueba. Seleccioná tu rol para continuar.
      </div>
      <div v-if="usandoSupabase && !usuarioAutenticado" class="alert alert-info mb-6">
        Iniciá sesión con tu cuenta de Supabase.
      </div>

      <!-- Formulario de Supabase (email + contraseña) -->
      <div v-if="usandoSupabase && !usuarioAutenticado" class="space-y-4">
        <div>
          <label class="label">Correo electrónico</label>
          <input v-model="email" type="email" class="input" placeholder="tu@escuela.edu.ar" />
        </div>
        <div class="relative">
          <label class="label">Contraseña</label>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="input pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
            title="Mostrar u ocultar contraseña"
          >
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>
        <button @click="iniciarSesionSupabase" class="btn-primary w-full py-3">
          Iniciar sesión
        </button>
        <p class="text-center text-xs text-gray-500 mt-3">
          ¿No tenés cuenta?
          <button @click="mostrarRegistro = !mostrarRegistro" class="text-blue-600 hover:underline">
            Crear una
          </button>
        </p>
      </div>

      <!-- Formulario de registro -->
      <div v-if="mostrarRegistro && usandoSupabase && !usuarioAutenticado" class="mt-6 p-4 border border-gray-200 rounded bg-gray-50 space-y-3">
        <h4 class="text-sm font-bold text-gray-700">Crear cuenta</h4>
        <div>
          <label class="label">Nombre completo</label>
          <input v-model="regNombre" type="text" class="input" placeholder="Juan Pérez" />
        </div>
        <div>
          <label class="label">Correo electrónico</label>
          <input v-model="regEmail" type="email" class="input" placeholder="juan@escuela.edu.ar" />
        </div>
        <div class="relative">
          <label class="label">Contraseña</label>
          <input
            v-model="regPassword"
            :type="showRegPassword ? 'text' : 'password'"
            class="input pr-10"
            placeholder="••••••••"
          />
          <button
            type="button"
            @click="showRegPassword = !showRegPassword"
            class="absolute right-3 top-10 text-gray-500 hover:text-gray-700"
            title="Mostrar u ocultar contraseña"
          >
            {{ showRegPassword ? '🙈' : '👁️' }}
          </button>
        </div>
        <div>
          <label class="label">Rol</label>
          <select v-model="regRol" class="input">
            <option value="tesorero">Tesorero</option>
            <option value="administracion">Administración</option>
            <option value="distribucion">Distribución</option>
            <option value="secretario">Secretario</option>
            <option value="asociado">Asociado</option>
            <option value="docente_asesor">Docente Asesor</option>
            <option value="director">Director</option>
          </select>
        </div>
        <div class="flex justify-end gap-3">
          <button @click="mostrarRegistro = false" class="btn-secondary text-sm">Cancelar</button>
          <button @click="registrarseSupabase" class="btn-success text-sm">Crear cuenta</button>
        </div>
      </div>

      <!-- Selección de rol (modo simulado) -->
      <div v-if="modoPrueba && !rolSeleccionado" class="space-y-4">
        <label class="block text-sm font-medium text-gray-700">Seleccioná tu rol:</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="rol in rolesDisponibles"
            :key="rol.id"
            @click="seleccionarRol(rol.id, rol.nombre)"
            class="btn-secondary py-3 text-sm text-left hover:bg-blue-50 border border-gray-300"
          >
            {{ rol.nombre }}
          </button>
        </div>
      </div>

      <!-- Botón de ingreso (modo simulado) -->
      <div v-if="modoPrueba && rolSeleccionado" class="text-center mt-6">
        <p class="text-sm text-gray-600 mb-4">
          Ingresando como <strong>{{ rolSeleccionado.nombre }}</strong>
        </p>
        <button @click="ingresarModoPrueba" class="btn-primary w-full py-3">
          Ingresar al sistema
        </button>
        <button @click="rolSeleccionado = null" class="btn-secondary text-sm mt-3">
          Elegir otro rol
        </button>
      </div>

      <!-- Mensaje de bienvenida (usuario autenticado en Supabase) -->
      <div v-if="usandoSupabase && usuarioAutenticado" class="text-center mt-6">
        <p class="text-sm text-gray-600 mb-4">
          Bienvenido, {{ userName }} ({{ rolTexto }})
        </p>
        <button @click="ingresarSupabase" class="btn-primary w-full py-3">
          Ingresar al sistema
        </button>
      </div>

      <div class="mt-8 pt-6 border-t border-gray-200 text-center">
        <p class="text-xs text-gray-400">
          Primera versión: roles simulados. Sin contraseñas reales todavía.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/utils/roles'

const router = useRouter()
const authStore = useAuthStore()

const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const usandoSupabase = computed(() => authStore.usingSupabase)
const usuarioAutenticado = computed(() => authStore.isAuthenticated)
const userName = computed(() => authStore.userName)

const rolSeleccionado = ref(null)
const rolesDisponibles = ref(ROLES)

// Formulario Supabase
const email = ref('')
const password = ref('')
const showPassword = ref(false)   // controlar visibilidad de contraseña (login)
const mostrarRegistro = ref(false)
const regNombre = ref('')
const regEmail = ref('')
const regPassword = ref('')
const showRegPassword = ref(false) // controlar visibilidad de contraseña (registro)
const regRol = ref('tesorero')

// Rol texto para mostrar
const rolTexto = computed(() => {
  if (!authStore.role) return '—'
  const rol = ROLES.find((r) => r.id === authStore.role)
  return rol ? rol.nombre : authStore.role
})

function seleccionarRol(id, nombre) {
  rolSeleccionado.value = { id, nombre }
}

function ingresarModoPrueba() {
  authStore.loginSimulado(rolSeleccionado.value.id, rolSeleccionado.value.nombre)
  authStore.setUsingSupabase(false)
  router.push('/')
}

async function iniciarSesionSupabase() {
  try {
    await authStore.login(email.value, password.value)
    router.push('/')
  } catch (error) {
    alert('Error al iniciar sesión: ' + error.message)
  }
}

async function registrarseSupabase() {
  try {
    await authStore.registrar(regEmail.value, regPassword.value, regRol.value, regNombre.value)
    mostrarRegistro.value = false
    alert('Cuenta creada. Ahora podés iniciar sesión.')
  } catch (error) {
    alert('Error al crear cuenta: ' + error.message)
  }
}

function ingresarSupabase() {
  router.push('/')
}
</script>
