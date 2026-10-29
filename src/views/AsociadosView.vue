<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando asociados..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Asociados</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nuevo asociado
      </button>
    </div>

    <!-- Alertas -->
    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Buscador y filtro -->
    <div v-if="!cargando" class="flex gap-2 sm:flex-wrap">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar por nombre o apellido..."
        class="input"
      />
      <select v-model="filtroActivo" class="input">
        <option value="todos">Todos</option>
        <option value="activos">Activos</option>
        <option value="inactivos">Dados de baja</option>
      </select>
    </div>

    <!-- Listado -->
    <div v-if="!cargando && asociadosFiltrados.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Curso</th>
            <th>Div.</th>
            <th>Teléfono</th>
            <th>Fecha alta</th>
            <th>Estado</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in asociadosFiltrados" :key="a.id">
            <td>{{ a.nombre }}</td>
            <td>{{ a.apellido }}</td>
            <td>{{ a.curso }}°</td>
            <td>{{ a.division }}</td>
            <td>{{ a.telefono || '—' }}</td>
            <td>{{ formatearFecha(a.fecha_alta) }}</td>
            <td>
              <DataBadge :estado="a.activo ? 'activa' : 'baja'" />
            </td>
            <td class="text-center">
              <button
                @click="editarAsociado(a)"
                class="text-blue-600 hover:text-blue-800 text-sm"
                :disabled="!puedeEscribir"
              >
                Editar
              </button>
              <button
                @click="confirmarBaja(a)"
                class="text-red-600 hover:text-red-800 text-sm ml-3"
                :disabled="!puedeEscribir"
              >
                {{ a.activo ? 'Dar de baja' : 'Reactivar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <EmptyState
      v-if="!cargando && asociadosFiltrados.length === 0"
      mensaje="No se encontraron asociados."
    />

    <!-- Formulario (alta/edición) -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar asociado' : 'Nuevo asociado' }}
      </h3>
      <form @submit.prevent="guardarAsociado" class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Nombre</label>
            <input
              v-model="form.nombre"
              type="text"
              class="input"
              :class="{ 'border-red-500': errores.nombre }"
            />
            <p v-if="errores.nombre" class="error-text">{{ errores.nombre }}</p>
          </div>
          <div>
            <label class="label">Apellido</label>
            <input
              v-model="form.apellido"
              type="text"
              class="input"
              :class="{ 'border-red-500': errores.apellido }"
            />
            <p v-if="errores.apellido" class="error-text">{{ errores.apellido }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Curso</label>
            <select v-model="form.curso" class="input">
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
            <label class="label">División</label>
            <select v-model="form.division" class="input">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Teléfono</label>
          <input
            v-model="form.telefono"
            type="text"
            placeholder="2231-123456"
            class="input"
            :class="{ 'border-red-500': errores.telefono }"
          />
          <p v-if="errores.telefono" class="error-text">{{ errores.telefono }}</p>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="cerrarFormulario()" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-success" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </div>

    <!-- Diálogo de confirmación de baja -->
    <ConfirmDialog
      :abierto="dialogoBajaAbierto"
      :titulo="`${asociadoSeleccionado?.activo ? 'Dar de baja' : 'Reactivar'} asociado`"
      :mensaje="`¿Estás seguro de ${asociadoSeleccionado?.activo ? 'dar de baja' : 'reactivar'} a {{ asociadoSeleccionado?.nombre }} {{ asociadoSeleccionado?.apellido }}? Se conservará el historial.`"
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
import { requerido, telefono, cursoValido, divisionValida } from '@/utils/validators'
import { asociadosService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import DataBadge from '@/components/DataBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

if (!puedeAcceder(authStore.role, 'Asociados')) {
  console.warn('Sin permiso para ver Asociados')
}

// Carga y estado
const cargando = ref(false)
const errorCarga = ref(null)
const asociados = ref([])

// Filtros
const filtroBusqueda = ref('')
const filtroActivo = ref('todos')

// Formulario
const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  nombre: '',
  apellido: '',
  curso: 1,
  division: '1',
  telefono: '',
})
const errores = ref({})

// Diálogo de baja
const dialogoBajaAbierto = ref(false)
const asociadoSeleccionado = ref(null)

// Alerta temporal
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

// Cargar asociados desde Supabase o mock
async function cargarAsociados() {
  cargando.value = true
  errorCarga.value = null
  try {
    const { data, error } = await asociadosService.listar()
    if (error) throw error
    asociados.value = data || []
  } catch (e) {
    errorCarga.value = 'No se pudieron cargar los asociados: ' + e.message
  } finally {
    cargando.value = false
  }
}

const asociadosFiltrados = computed(() => {
  let lista = asociados.value

  if (filtroActivo.value === 'activos') {
    lista = lista.filter((a) => a.activo)
  } else if (filtroActivo.value === 'inactivos') {
    lista = lista.filter((a) => !a.activo)
  }

  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.apellido.toLowerCase().includes(q)
    )
  }

  return lista
})

function abrirFormulario(asociado = null) {
  editando.value = !!asociado
  if (asociado) {
    form.value = { ...asociado }
  } else {
    form.value = { id: null, nombre: '', apellido: '', curso: 1, division: '1', telefono: '' }
  }
  errores.value = {}
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
  editando.value = false
  form.value = { id: null, nombre: '', apellido: '', curso: 1, division: '1', telefono: '' }
  errores.value = {}
}

async function guardarAsociado() {
  errores.value = {}

  const vNombre = requerido(form.value.nombre)
  const vApellido = requerido(form.value.apellido)
  const vTelefono = telefono(form.value.telefono)

  if (vNombre) errores.value.nombre = vNombre
  if (vApellido) errores.value.apellido = vApellido
  if (vTelefono) errores.value.telefono = vTelefono

  if (vNombre || vApellido || vTelefono) return

  guardando.value = true
  try {
    if (editando.value) {
      const { error } = await asociadosService.actualizar(form.value.id, {
        nombre: form.value.nombre,
        apellido: form.value.apellido,
        curso: form.value.curso,
        division: form.value.division,
        telefono: form.value.telefono,
      })
      if (error) throw error
      mostrarAlerta('success', 'Asociado modificado correctamente.')
    } else {
      const { data, error } = await asociadosService.crear({
        nombre: form.value.nombre,
        apellido: form.value.apellido,
        curso: form.value.curso,
        division: form.value.division,
        telefono: form.value.telefono,
        activo: true,
      })
      if (error) throw error
      mostrarAlerta('success', 'Asociado dado de alta correctamente.')
    }
    await cargarAsociados()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function confirmarBaja(asociado) {
  asociadoSeleccionado.value = asociado
  dialogoBajaAbierto.value = true
}

async function ejecutarBaja() {
  if (!asociadoSeleccionado.value) return
  const accion = asociadoSeleccionado.value.activo ? 'darDeBaja' : 'reactivar'
  try {
    const { error } = await asociadosService[accion](asociadoSeleccionado.value.id)
    if (error) throw error
    const texto = asociadoSeleccionado.value.activo ? 'dado de baja' : 'reactivado'
    mostrarAlerta('success', `Asociado ${texto} correctamente.`)
    await cargarAsociados()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo cambiar el estado: ' + e.message)
  } finally {
    dialogoBajaAbierto.value = false
    asociadoSeleccionado.value = null
  }
}

function editarAsociado(asociado) {
  abrirFormulario(asociado)
}

onMounted(() => {
  cargarAsociados()
})
</script>
