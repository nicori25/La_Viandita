<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando tareas..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Tareas asignadas</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nueva tarea
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Buscador y filtros -->
    <div v-if="!cargando" class="flex gap-2 sm:flex-wrap">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar tarea o comisión..."
        class="input"
      />
      <select v-model="filtroComision" class="input">
        <option value="todos">Todas las comisiones</option>
        <option v-for="c in comisionesLista" :key="c.id" :value="c.id">
          {{ c.nombre }}
        </option>
      </select>
      <select v-model="filtroCumplida" class="input">
        <option value="todos">Todas</option>
        <option value="true">Cumplidas</option>
        <option value="false">Pendientes</option>
      </select>
    </div>

    <div v-if="!cargando && tareasFiltradas.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Comisión</th>
            <th>Descripción</th>
            <th>Fecha asignada</th>
            <th>Fecha límite</th>
            <th>Estado</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tareasFiltradas" :key="t.id">
            <td>{{ nombreComision(t.comision_id) }}</td>
            <td>{{ t.descripcion }}</td>
            <td>{{ formatearFecha(t.fecha_asignada) }}</td>
            <td :class="claseFechaLimite(t)">{{ formatearFecha(t.fecha_limite) }}</td>
            <td>
              <DataBadge :estado="t.cumplida ? 'cumplida' : 'pendiente'" />
            </td>
            <td class="text-center">
              <button
                @click="toggleCumplida(t)"
                class="px-2 py-1 rounded text-sm"
                :class="
                  t.cumplida
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                "
                :disabled="!puedeEscribir"
              >
                {{ t.cumplida ? 'Desmarcar' : 'Marcar cumplida' }}
              </button>
              <button
                @click="editarTarea(t)"
                class="text-blue-600 hover:text-blue-800 text-sm ml-3"
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
      v-if="!cargando && tareasFiltradas.length === 0"
      mensaje="No se encontraron tareas."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar tarea' : 'Nueva tarea' }}
      </h3>
      <form @submit.prevent="guardarTarea" class="space-y-3">
        <div>
          <label class="label">Comisión responsable</label>
          <select v-model="form.comision_id" class="input" required>
            <option v-for="c in comisionesLista" :key="c.id" :value="c.id">
              {{ c.nombre }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">Descripción</label>
          <input
            v-model="form.descripcion"
            type="text"
            placeholder="Ej: Cobrar suscripciones de la semana"
            class="input"
            required
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Fecha asignada</label>
            <input v-model="form.fecha_asignada" type="date" class="input" required />
          </div>
          <div>
            <label class="label">Fecha límite</label>
            <input v-model="form.fecha_limite" type="date" class="input" required />
          </div>
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
import { tareasService, comisionesService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import DataBadge from '@/components/DataBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

const cargando = ref(false)
const errorCarga = ref(null)
const tareas = ref([])
const comisionesLista = ref([])

const filtroBusqueda = ref('')
const filtroComision = ref('todos')
const filtroCumplida = ref('todos')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  comision_id: '',
  descripcion: '',
  fecha_asignada: '',
  fecha_limite: '',
  cumplida: false,
})
const errores = ref({})

const alerta = ref(null)

function mostrarAlerta(tipo, mensaje) {
  alerta.value = { tipo, mensaje }
  setTimeout(() => { alerta.value = null }, 4000)
}

async function cargarDatos() {
  cargando.value = true
  errorCarga.value = null
  try {
    const [resTareas, resComisiones] = await Promise.all([
      tareasService.listar(),
      comisionesService.listar(),
    ])
    if (resTareas.error) throw resTareas.error
    if (resComisiones.error) throw resComisiones.error
    tareas.value = resTareas.data || []
    comisionesLista.value = resComisiones.data || []
  } catch (e) {
    errorCarga.value = 'No se pudieron cargar las tareas: ' + e.message
  } finally {
    cargando.value = false
  }
}

const tareasFiltradas = computed(() => {
  let lista = tareas.value

  if (filtroComision.value !== 'todos') {
    lista = lista.filter((t) => t.comision_id === filtroComision.value)
  }

  if (filtroCumplida.value !== 'todos') {
    const cumple = filtroCumplida.value === 'true'
    lista = lista.filter((t) => t.cumplida === cumple)
  }

  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter((t) => {
      const c = nombreComision(t.comision_id).toLowerCase()
      return t.descripcion.toLowerCase().includes(q) || c.includes(q)
    })
  }

  return lista
})

function nombreComision(id) {
  const c = comisionesLista.value.find((x) => x.id === id)
  return c ? c.nombre : '—'
}

function formatearFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR')
}

function claseFechaLimite(t) {
  if (t.cumplida) return 'text-green-700'
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(t.fecha_limite + 'T00:00:00')
  if (limite < hoy) return 'text-red-700 font-bold'
  return 'text-gray-700'
}

function abrirFormulario(t = null) {
  editando.value = !!t
  if (t) {
    form.value = { ...t }
  } else {
    form.value = {
      id: null,
      comision_id: '',
      descripcion: '',
      fecha_asignada: '',
      fecha_limite: '',
      cumplida: false,
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

async function guardarTarea() {
  errores.value = {}

  if (!form.value.comision_id) errores.value.comision_id = 'Seleccioná una comisión.'
  if (!requerido(form.value.descripcion)) errores.value.descripcion = 'La descripción es obligatoria.'
  if (!form.value.fecha_asignada) errores.value.fecha_asignada = 'La fecha asignada es obligatoria.'
  if (!form.value.fecha_limite) errores.value.fecha_limite = 'La fecha límite es obligatoria.'

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      comision_id: form.value.comision_id,
      descripcion: form.value.descripcion,
      fecha_asignada: form.value.fecha_asignada,
      fecha_limite: form.value.fecha_limite,
      cumplida: form.value.cumplida === 'true' || form.value.cumplida === true,
    }

    if (editando.value) {
      const { error } = await tareasService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Tarea modificada correctamente.')
    } else {
      const { error } = await tareasService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Tarea creada correctamente.')
    }
    await cargarDatos()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function toggleCumplida(t) {
  const nueva = !t.cumplida
  const payload = { cumplida: nueva, fecha_cumplimiento: nueva ? new Date().toISOString().split('T')[0] : null }
  tareasService.actualizar(t.id, payload).then(() => {
    t.cumplida = nueva
    t.fecha_cumplimiento = payload.fecha_cumplimiento
    mostrarAlerta('success', `Tarea marcada como ${nueva ? 'cumplida' : 'pendiente'}.`)
  }).catch((e) => {
    mostrarAlerta('error', 'No se pudo actualizar: ' + e.message)
  })
}

function editarTarea(t) {
  abrirFormulario(t)
}

onMounted(() => {
  cargarDatos()
})
</script>
