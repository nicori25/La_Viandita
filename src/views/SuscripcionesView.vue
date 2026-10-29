<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando suscripciones..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Suscripciones</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nueva suscripción
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Buscador y filtro -->
    <div v-if="!cargando" class="flex gap-2 sm:flex-wrap">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar asociado..."
        class="input"
      />
      <select v-model="filtroEstado" class="input">
        <option value="todos">Todos</option>
        <option value="activa">Activas</option>
        <option value="baja">Dadas de baja</option>
      </select>
      <select v-model="filtroTipo" class="input">
        <option value="todos">Semanal / Mensual</option>
        <option value="semanal">Semanal</option>
        <option value="mensual">Mensual</option>
      </select>
    </div>

    <div v-if="!cargando && suscripcionesFiltradas.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Asociado</th>
            <th>Curso</th>
            <th>Tipo</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>Monto</th>
            <th>Estado</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in suscripcionesFiltradas" :key="s.id">
            <td>{{ nombreAsociado(s.asociado_id) }}</td>
            <td>{{ cursoAsociado(s.asociado_id) }}°</td>
            <td>{{ s.tipo }}</td>
            <td>{{ formatearFecha(s.fecha_inicio) }}</td>
            <td>{{ formatearFecha(s.fecha_fin) || '—' }}</td>
            <td>$ {{ Number(s.monto).toLocaleString('es-AR') }}</td>
            <td>
              <DataBadge :estado="s.estado" />
            </td>
            <td class="text-center">
              <button
                @click="editarSuscripcion(s)"
                class="text-blue-600 hover:text-blue-800 text-sm"
                :disabled="!puedeEscribir"
              >
                Editar
              </button>
              <button
                @click="confirmarBaja(s)"
                class="text-red-600 hover:text-red-800 text-sm ml-3"
                :disabled="!puedeEscribir"
              >
                {{ s.estado === 'activa' ? 'Dar de baja' : 'Reactivar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!cargando && suscripcionesFiltradas.length === 0"
      mensaje="No se encontraron suscripciones."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar suscripción' : 'Nueva suscripción' }}
      </h3>
      <form @submit.prevent="guardarSuscripcion" class="space-y-3">
        <div>
          <label class="label">Asociado</label>
          <select v-model="form.asociado_id" class="input" required>
            <option v-for="a in asociadosLista" :key="a.id" :value="a.id">
              {{ a.nombre }} {{ a.apellido }} ({{ a.curso }}°{{ a.division }})
            </option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Tipo</label>
            <select v-model="form.tipo" class="input" required>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div>
            <label class="label">Estado</label>
            <select v-model="form.estado" class="input" required>
              <option value="activa">Activa</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Fecha de inicio</label>
            <input v-model="form.fecha_inicio" type="date" class="input" required />
          </div>
          <div>
            <label class="label">Fecha de fin</label>
            <input v-model="form.fecha_fin" type="date" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Monto</label>
          <input
            v-model="form.monto"
            type="number"
            min="0"
            step="0.01"
            class="input"
            required
          />
          <p class="helper">Ej: 6000 o 22000</p>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="cerrarFormulario()" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-success" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </div>

    <ConfirmDialog
      :abierto="dialogoBajaAbierto"
      :titulo="`${suscripcionSeleccionada?.estado === 'activa' ? 'Dar de baja' : 'Reactivar'} suscripción`"
      :mensaje="`¿Estás seguro de ${suscripcionSeleccionada?.estado === 'activa' ? 'dar de baja' : 'reactivar'} esta suscripción? Se conservará el historial de pagos.`"
      textoBoton="Confirmar"
      @confirmar="ejecutarBaja"
      @cancelar="dialogoBajaAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { puedeAcceder } from '@/utils/roles'
import { numeroPositivo } from '@/utils/validators'
import { suscripcionesService, asociadosService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import DataBadge from '@/components/DataBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

const cargando = ref(false)
const errorCarga = ref(null)
const suscripciones = ref([])
const asociadosLista = ref([])

const filtroBusqueda = ref('')
const filtroEstado = ref('todos')
const filtroTipo = ref('todos')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  asociado_id: '',
  tipo: 'semanal',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'activa',
  monto: '',
})
const errores = ref({})

const dialogoBajaAbierto = ref(false)
const suscripcionSeleccionada = ref(null)
const alerta = ref(null)

function mostrarAlerta(tipo, mensaje) {
  alerta.value = { tipo, mensaje }
  setTimeout(() => { alerta.value = null }, 4000)
}

function formatearFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR')
}

async function cargarDatos() {
  cargando.value = true
  errorCarga.value = null
  try {
    const [resSuscripciones, resAsociados] = await Promise.all([
      suscripcionesService.listar(),
      asociadosService.listar(),
    ])
    if (resSuscripciones.error) throw resSuscripciones.error
    if (resAsociados.error) throw resAsociados.error
    suscripciones.value = resSuscripciones.data || []
    asociadosLista.value = resAsociados.data || []
  } catch (e) {
    errorCarga.value = 'No se pudieron cargar las suscripciones: ' + e.message
  } finally {
    cargando.value = false
  }
}

const suscripcionesFiltradas = computed(() => {
  let lista = suscripciones.value

  if (filtroEstado.value !== 'todos') {
    lista = lista.filter((s) => s.estado === filtroEstado.value)
  }
  if (filtroTipo.value !== 'todos') {
    lista = lista.filter((s) => s.tipo === filtroTipo.value)
  }
  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter((s) => {
      const a = asociadosLista.value.find((x) => x.id === s.asociado_id)
      if (!a) return false
      return (
        a.nombre.toLowerCase().includes(q) ||
        a.apellido.toLowerCase().includes(q)
      )
    })
  }
  return lista
})

function nombreAsociado(id) {
  const a = asociadosLista.value.find((x) => x.id === id)
  return a ? `${a.nombre} ${a.apellido}` : '—'
}

function cursoAsociado(id) {
  const a = asociadosLista.value.find((x) => x.id === id)
  return a ? a.curso : '—'
}

function abrirFormulario(s = null) {
  editando.value = !!s
  if (s) {
    form.value = { ...s }
  } else {
    form.value = {
      id: null,
      asociado_id: '',
      tipo: 'semanal',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'activa',
      monto: '',
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

async function guardarSuscripcion() {
  errores.value = {}

  if (!form.value.asociado_id) errores.value.asociado_id = 'Seleccioná un asociado.'
  if (!form.value.fecha_inicio) errores.value.fecha_inicio = 'La fecha de inicio es obligatoria.'
  const vMonto = numeroPositivo(form.value.monto)
  if (vMonto) errores.value.monto = vMonto

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      asociado_id: form.value.asociado_id,
      tipo: form.value.tipo,
      fecha_inicio: form.value.fecha_inicio,
      fecha_fin: form.value.fecha_fin || null,
      estado: form.value.estado,
      monto: Number(form.value.monto),
    }

    if (editando.value) {
      const { error } = await suscripcionesService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Suscripción modificada correctamente.')
    } else {
      const { error } = await suscripcionesService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Suscripción dada de alta correctamente.')
    }
    await cargarDatos()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function confirmarBaja(s) {
  suscripcionSeleccionada.value = s
  dialogoBajaAbierto.value = true
}

async function ejecutarBaja() {
  if (!suscripcionSeleccionada.value) return
  const accion = suscripcionSeleccionada.value.estado === 'activa' ? 'darDeBaja' : 'reactivar'
  try {
    const { error } = await suscripcionesService[accion](suscripcionSeleccionada.value.id)
    if (error) throw error
    const texto = suscripcionSeleccionada.value.estado === 'activa' ? 'dada de baja' : 'reactivada'
    mostrarAlerta('success', `Suscripción ${texto} correctamente.`)
    await cargarDatos()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo cambiar el estado: ' + e.message)
  } finally {
    dialogoBajaAbierto.value = false
    suscripcionSeleccionada.value = null
  }
}

function editarSuscripcion(s) {
  abrirFormulario(s)
}

onMounted(() => {
  cargarDatos()
})
</script>
