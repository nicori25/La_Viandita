<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando Libro de Caja..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Libro de Caja</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nuevo movimiento
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Resumen -->
    <div v-if="!cargando" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="card">
        <div class="text-sm text-gray-500">Ingresos</div>
        <div class="text-lg font-bold text-green-700">$ {{ totalIngresos }}</div>
      </div>
      <div class="card">
        <div class="text-sm text-gray-500">Egresos</div>
        <div class="text-lg font-bold text-red-700">$ {{ totalEgresos }}</div>
      </div>
      <div class="card">
        <div class="text-sm text-gray-500">Saldo</div>
        <div class="text-lg font-bold" :class="saldo >= 0 ? 'text-green-700' : 'text-red-700'">
          $ {{ saldo }}
        </div>
      </div>
    </div>

    <!-- Buscador y filtro -->
    <div v-if="!cargando" class="flex gap-2 sm:flex-wrap">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar concepto..."
        class="input"
      />
      <select v-model="filtroTipo" class="input">
        <option value="todos">Todos</option>
        <option value="ingreso">Ingresos</option>
        <option value="egreso">Egresos</option>
      </select>
    </div>

    <div v-if="!cargando && movimientosFiltrados.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Usuario</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in movimientosFiltrados" :key="m.id">
            <td>{{ formatearFecha(m.fecha) }}</td>
            <td>
              <DataBadge :estado="m.tipo" />
            </td>
            <td>{{ m.concepto }}</td>
            <td class="font-mono">
              $ {{ Number(m.monto).toLocaleString('es-AR') }}
            </td>
            <td>{{ nombreUsuario(m.usuario_id) }}</td>
            <td class="text-center">
              <button
                @click="confirmarEliminar(m)"
                class="text-red-600 hover:text-red-800 text-sm"
                :disabled="!puedeEscribir"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!cargando && movimientosFiltrados.length === 0"
      mensaje="No se encontraron movimientos."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar movimiento' : 'Nuevo movimiento de caja' }}
      </h3>
      <form @submit.prevent="guardarMovimiento" class="space-y-3">
        <div>
          <label class="label">Tipo de movimiento</label>
          <select v-model="form.tipo" class="input" required>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div>
          <label class="label">Concepto</label>
          <input
            v-model="form.concepto"
            type="text"
            placeholder="Ej: Cobro de suscripción, compra de insumos..."
            class="input"
            required
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <div>
            <label class="label">Fecha</label>
            <input v-model="form.fecha" type="date" class="input" required />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="cerrarFormulario()" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-success" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </div>

    <ConfirmDialog
      :abierto="dialogoEliminarAbierto"
      titulo="¿Eliminar movimiento de caja?"
      :mensaje="`¿Estás seguro de eliminar el movimiento "${movimientoSeleccionado?.concepto}"?`"
      textoBoton="Confirmar eliminación"
      @confirmar="ejecutarEliminar"
      @cancelar="dialogoEliminarAbierto = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { puedeAcceder } from '@/utils/roles'
import { requerido, numeroPositivo } from '@/utils/validators'
import { libroCajaService, usuariosService } from '@/services/db'
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
const movimientos = ref([])
const usuariosLista = ref([])

const filtroBusqueda = ref('')
const filtroTipo = ref('todos')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  tipo: 'ingreso',
  concepto: '',
  monto: '',
  fecha: '',
  usuario_id: '',
})
const errores = ref({})

const dialogoEliminarAbierto = ref(false)
const movimientoSeleccionado = ref(null)
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
    const [resMovimientos, resUsuarios] = await Promise.all([
      libroCajaService.listar(),
      usuariosService.listar(),
    ])
    if (resMovimientos.error) throw resMovimientos.error
    if (resUsuarios.error) throw resUsuarios.error
    movimientos.value = resMovimientos.data || []
    usuariosLista.value = resUsuarios.data || []
  } catch (e) {
    errorCarga.value = 'No se pudo cargar el Libro de Caja: ' + e.message
  } finally {
    cargando.value = false
  }
}

const movimientosFiltrados = computed(() => {
  let lista = movimientos.value

  if (filtroTipo.value !== 'todos') {
    lista = lista.filter((m) => m.tipo === filtroTipo.value)
  }

  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter((m) => m.concepto.toLowerCase().includes(q))
  }

  return lista
})

function nombreUsuario(id) {
  const u = usuariosLista.value.find((x) => x.id === id)
  return u ? u.nombre : '—'
}

const totalIngresos = computed(() =>
  movimientos.value
    .filter((m) => m.tipo === 'ingreso')
    .reduce((s, m) => s + Number(m.monto), 0)
    .toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
)
const totalEgresos = computed(() =>
  movimientos.value
    .filter((m) => m.tipo === 'egreso')
    .reduce((s, m) => s + Number(m.monto), 0)
    .toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
)
const saldo = computed(() =>
  Number(totalIngresos.value.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.')) -
  Number(totalEgresos.value.replace(/[^\d,-]/g, '').replace('.', '').replace(',', '.'))
)

function abrirFormulario(m = null) {
  editando.value = !!m
  if (m) {
    form.value = { ...m }
  } else {
    form.value = {
      id: null,
      tipo: 'ingreso',
      concepto: '',
      monto: '',
      fecha: '',
      usuario_id: '',
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

async function guardarMovimiento() {
  errores.value = {}

  if (!form.value.tipo) errores.value.tipo = 'Seleccioná un tipo.'
  if (!requerido(form.value.concepto)) errores.value.concepto = 'El concepto es obligatorio.'
  const vMonto = numeroPositivo(form.value.monto)
  if (vMonto) errores.value.monto = vMonto
  if (!form.value.fecha) errores.value.fecha = 'La fecha es obligatoria.'

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      tipo: form.value.tipo,
      concepto: form.value.concepto,
      monto: Number(form.value.monto),
      fecha: form.value.fecha,
      usuario_id: authStore.user?.id || form.value.usuario_id || null,
    }

    if (editando.value) {
      const { error } = await libroCajaService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Movimiento modificado correctamente.')
    } else {
      const { error } = await libroCajaService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Movimiento registrado correctamente.')
    }
    await cargarDatos()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(m) {
  movimientoSeleccionado.value = m
  dialogoEliminarAbierto.value = true
}

async function ejecutarEliminar() {
  if (!movimientoSeleccionado.value) return
  try {
    const { error } = await libroCajaService.eliminar(movimientoSeleccionado.value.id)
    if (error) throw error
    mostrarAlerta('success', 'Movimiento eliminado correctamente.')
    await cargarDatos()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo eliminar: ' + e.message)
  } finally {
    dialogoEliminarAbierto.value = false
    movimientoSeleccionado.value = null
  }
}

function editarMovimiento(m) {
  abrirFormulario(m)
}

onMounted(() => {
  cargarDatos()
})
</script>
