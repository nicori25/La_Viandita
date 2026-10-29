<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando actas..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Actas (Libro de Actas)</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nueva acta
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Buscador y filtro -->
    <div v-if="!cargando" class="flex gap-2">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar por contenido o tipo..."
        class="input"
      />
      <select v-model="filtroTipo" class="input">
        <option value="todos">Todos</option>
        <option value="asamblea">Asamblea</option>
        <option value="consejo">Consejo</option>
      </select>
    </div>

    <div v-if="!cargando && actasFiltradas.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo de reunión</th>
            <th>Contenido</th>
            <th>¿Aprobada?</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in actasFiltradas" :key="a.id">
            <td>{{ formatearFecha(a.fecha) }}</td>
            <td>{{ a.tipo_reunion }}</td>
            <td class="max-w-xs truncate" :title="a.contenido">{{ a.contenido }}</td>
            <td class="text-center">
              <DataBadge :estado="a.aprobada ? 'activa' : 'baja'" />
            </td>
            <td class="text-center">
              <button
                @click="editarActa(a)"
                class="text-blue-600 hover:text-blue-800 text-sm"
                :disabled="!puedeEscribir"
              >
                Editar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!cargando && actasFiltradas.length === 0"
      mensaje="No se encontraron actas."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar acta' : 'Nueva acta' }}
      </h3>
      <form @submit.prevent="guardarActa" class="space-y-3">
        <div>
          <label class="label">Tipo de reunión</label>
          <select v-model="form.tipo_reunion" class="input" required>
            <option value="asamblea">Asamblea</option>
            <option value="consejo">Consejo de Administración</option>
          </select>
        </div>
        <div>
          <label class="label">Fecha</label>
          <input v-model="form.fecha" type="date" class="input" required />
        </div>
        <div>
          <label class="label">Contenido de la acta</label>
          <textarea
            v-model="form.contenido"
            rows="4"
            placeholder="Resoluciones, acuerdos, asistentes..."
            class="input"
            required
          ></textarea>
        </div>
        <div>
          <label class="label">¿Aprobada?</label>
          <select v-model="form.aprobada" class="input">
            <option value="false">No (pendiente)</option>
            <option value="true">Sí, aprobada</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="cerrarFormulario()" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-success" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { puedeAcceder } from '@/utils/roles'
import { requerido } from '@/utils/validators'
import { actasService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import DataBadge from '@/components/DataBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

const cargando = ref(false)
const errorCarga = ref(null)
const actas = ref([])

const filtroBusqueda = ref('')
const filtroTipo = ref('todos')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  fecha: '',
  tipo_reunion: 'consejo',
  contenido: '',
  aprobada: false,
})
const errores = ref({})

const alerta = ref(null)

function mostrarAlerta(tipo, mensaje) {
  alerta.value = { tipo, mensaje }
  setTimeout(() => { alerta.value = null }, 4000)
}

async function cargarActas() {
  cargando.value = true
  errorCarga.value = null
  try {
    const res = await actasService.listar()
    if (res.error) throw res.error
    actas.value = res.data || []
  } catch (e) {
    errorCarga.value = 'No se pudieron cargar las actas: ' + e.message
  } finally {
    cargando.value = false
  }
}

const actasFiltradas = computed(() => {
  let lista = actas.value

  if (filtroTipo.value !== 'todos') {
    lista = lista.filter((a) => a.tipo_reunion === filtroTipo.value)
  }

  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter(
      (a) =>
        a.contenido.toLowerCase().includes(q) ||
        a.tipo_reunion.toLowerCase().includes(q)
    )
  }

  return lista
})

function formatearFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR')
}

function abrirFormulario(a = null) {
  editando.value = !!a
  if (a) {
    form.value = { ...a }
  } else {
    form.value = {
      id: null,
      fecha: '',
      tipo_reunion: 'consejo',
      contenido: '',
      aprobada: false,
    }
  }
  errores.value = {}
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
  editando.value = false
  errores.value = {}
}

async function guardarActa() {
  errores.value = {}

  if (!requerido(form.value.tipo_reunion)) errores.value.tipo_reunion = 'Seleccioná un tipo de reunión.'
  if (!form.value.fecha) errores.value.fecha = 'La fecha es obligatoria.'
  if (!requerido(form.value.contenido)) errores.value.contenido = 'El contenido es obligatorio.'

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      fecha: form.value.fecha,
      tipo_reunion: form.value.tipo_reunion,
      contenido: form.value.contenido,
      aprobada: form.value.aprobada === 'true' || form.value.aprobada === true,
    }

    if (editando.value) {
      const { error } = await actasService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Acta modificada correctamente.')
    } else {
      const { error } = await actasService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Acta creada correctamente.')
    }
    await cargarActas()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function editarActa(a) {
  abrirFormulario(a)
}

onMounted(() => {
  cargarActas()
})
</script>
