<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando pedidos..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Pedidos</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nuevo pedido
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Buscador y filtros -->
    <div v-if="!cargando" class="flex gap-2 sm:flex-wrap">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar por curso o asociado..."
        class="input"
      />
      <select v-model="filtroCurso" class="input">
        <option value="todos">Todos los cursos</option>
        <option value="1">1°</option>
        <option value="2">2°</option>
        <option value="3">3°</option>
        <option value="4">4°</option>
        <option value="5">5°</option>
        <option value="6">6°</option>
        <option value="7">7°</option>
      </select>
    </div>

    <div v-if="!cargando && pedidosFiltrados.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Asociado</th>
            <th>Curso</th>
            <th>Menú / Vianda</th>
            <th>Cantidad</th>
            <th>Fecha</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pedidosFiltrados" :key="p.id">
            <td>{{ nombreAsociado(p.suscripcion_id) }}</td>
            <td>{{ p.curso }}°</td>
            <td>{{ descripcionMenu(p.menu_id) }}</td>
            <td>{{ p.cantidad }}</td>
            <td>{{ formatearFecha(p.fecha) }}</td>
            <td class="text-center">
              <button
                @click="editarPedido(p)"
                class="text-blue-600 hover:text-blue-800 text-sm"
                :disabled="!puedeEscribir"
              >
                Editar
              </button>
              <button
                @click="confirmarCancelar(p)"
                class="text-red-600 hover:text-red-800 text-sm ml-3"
                :disabled="!puedeEscribir"
              >
                Cancelar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!cargando && pedidosFiltrados.length === 0"
      mensaje="No se encontraron pedidos."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar pedido' : 'Nuevo pedido' }}
      </h3>
      <form @submit.prevent="guardarPedido" class="space-y-3">
        <div>
          <label class="label">Suscripción (asociado)</label>
          <select v-model="form.suscripcion_id" class="input" required>
            <option v-for="s in suscripcionesLista" :key="s.id" :value="s.id">
              {{ nombreAsociadoPorSuscripcion(s.id) }} - {{ s.tipo }} ({{ s.estado }})
            </option>
          </select>
        </div>
        <div>
          <label class="label">Menú semanal</label>
          <select v-model="form.menu_id" class="input" required>
            <option v-for="m in menuLista" :key="m.id" :value="m.id">
              {{ m.semana }} - {{ tipoViandaNombre(m.tipo_vianda_id) }} ($ {{ Number(m.precio) }})
            </option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Curso</label>
            <select v-model="form.curso" class="input" required>
              <option value="1">1°</option>
              <option value="2">2°</option>
              <option value="3">3°</option>
              <option value="4">4°</option>
              <option value="5">5°</option>
              <option value="6">6°</option>
              <option value="7">7°</option>
            </select>
          </div>
          <div>
            <label class="label">Cantidad</label>
            <input
              v-model="form.cantidad"
              type="number"
              min="1"
              class="input"
              required
            />
          </div>
        </div>
        <div>
          <label class="label">Fecha</label>
          <input v-model="form.fecha" type="date" class="input" required />
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="cerrarFormulario()" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-success" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </div>

    <ConfirmDialog
      :abierto="dialogoCancelarAbierto"
      titulo="¿Cancelar pedido?"
      :mensaje="`¿Estás seguro de cancelar el pedido de {{ pedidoSeleccionado?.cantidad }} vianda(s) para el curso {{ pedidoSeleccionado?.curso }}°?`"
      textoBoton="Confirmar cancelación"
      @confirmar="ejecutarCancelar"
      @cancelar="dialogoCancelarAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { puedeAcceder } from '@/utils/roles'
import { requerido, enteroPositivo } from '@/utils/validators'
import { pedidosService, suscripcionesService, menuSemanalService, tiposViandaService, asociadosService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

const cargando = ref(false)
const errorCarga = ref(null)
const pedidos = ref([])
const suscripcionesLista = ref([])
const menuLista = ref([])
const tiposViandaLista = ref([])
const asociadosMap = ref({})

const filtroBusqueda = ref('')
const filtroCurso = ref('todos')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  suscripcion_id: '',
  menu_id: '',
  curso: 1,
  cantidad: 1,
  fecha: '',
})
const errores = ref({})

const dialogoCancelarAbierto = ref(false)
const pedidoSeleccionado = ref(null)
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
    const [resPedidos, resSuscripciones, resMenu, resTipos, resAsociados] = await Promise.all([
      pedidosService.listar(),
      suscripcionesService.listar(),
      menuSemanalService.listar(),
      tiposViandaService.listar(),
      asociadosService.listar(),
    ])
    if (resPedidos.error) throw resPedidos.error
    if (resSuscripciones.error) throw resSuscripciones.error
    if (resMenu.error) throw resMenu.error
    if (resTipos.error) throw resTipos.error
    if (resAsociados.error) throw resAsociados.error

    pedidos.value = resPedidos.data || []
    suscripcionesLista.value = resSuscripciones.data || []
    menuLista.value = resMenu.data || []
    tiposViandaLista.value = resTipos.data || []

    // Indexar asociados por id para búsqueda rápida
    const mapa = {}
    resAsociados.data.forEach((a) => { mapa[a.id] = a })
    asociadosMap.value = mapa
  } catch (e) {
    errorCarga.value = 'No se pudieron cargar los pedidos: ' + e.message
  } finally {
    cargando.value = false
  }
}

const pedidosFiltrados = computed(() => {
  let lista = pedidos.value

  if (filtroCurso.value !== 'todos') {
    lista = lista.filter((p) => String(p.curso) === filtroCurso.value)
  }

  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter((p) => nombreAsociado(p.suscripcion_id).toLowerCase().includes(q))
  }

  return lista
})

function nombreAsociado(idSuscripcion) {
  const s = suscripcionesLista.value.find((x) => x.id === idSuscripcion)
  if (!s) return '—'
  const a = asociadosMap.value[s.asociado_id]
  return a ? `${a.nombre} ${a.apellido}` : '—'
}

function nombreAsociadoPorSuscripcion(idSuscripcion) {
  return nombreAsociado(idSuscripcion)
}

function descripcionMenu(idMenu) {
  const m = menuLista.value.find((x) => x.id === idMenu)
  if (!m) return '—'
  return `${tipoViandaNombre(m.tipo_vianda_id)} - ${m.semana}`
}

function tipoViandaNombre(idTipo) {
  const t = tiposViandaLista.value.find((x) => x.id === idTipo)
  return t ? t.nombre : '—'
}

function abrirFormulario(p = null) {
  editando.value = !!p
  if (p) {
    form.value = { ...p }
  } else {
    form.value = { id: null, suscripcion_id: '', menu_id: '', curso: 1, cantidad: 1, fecha: '' }
  }
  errores.value = {}
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
  editando.value = false
  errores.value = {}
}

async function guardarPedido() {
  errores.value = {}

  if (!form.value.suscripcion_id) errores.value.suscripcion_id = 'Seleccioná una suscripción.'
  if (!form.value.menu_id) errores.value.menu_id = 'Seleccioná un menú.'
  const vCantidad = enteroPositivo(form.value.cantidad)
  if (vCantidad) errores.value.cantidad = vCantidad
  if (!form.value.fecha) errores.value.fecha = 'La fecha es obligatoria.'

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      suscripcion_id: form.value.suscripcion_id,
      menu_id: form.value.menu_id,
      curso: Number(form.value.curso),
      cantidad: Number(form.value.cantidad),
      fecha: form.value.fecha,
    }

    if (editando.value) {
      const { error } = await pedidosService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Pedido modificado correctamente.')
    } else {
      const { error } = await pedidosService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Pedido creado correctamente.')
    }
    await cargarDatos()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function confirmarCancelar(p) {
  pedidoSeleccionado.value = p
  dialogoCancelarAbierto.value = true
}

async function ejecutarCancelar() {
  if (!pedidoSeleccionado.value) return
  try {
    const { error } = await pedidosService.eliminar(pedidoSeleccionado.value.id)
    if (error) throw error
    mostrarAlerta('success', 'Pedido cancelado correctamente.')
    await cargarDatos()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo cancelar: ' + e.message)
  } finally {
    dialogoCancelarAbierto.value = false
    pedidoSeleccionado.value = null
  }
}

function editarPedido(p) {
  abrirFormulario(p)
}

onMounted(() => {
  cargarDatos()
})
</script>
