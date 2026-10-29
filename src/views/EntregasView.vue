<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando entregas..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Entregas</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Registrar entrega
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Estadística rápida -->
    <div v-if="!cargando" class="card mb-4">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-semibold text-gray-500">Entregas en horario</span>
        <DataBadge :estado="entregasDentroFranja > 0 ? 'dentro' : 'fuera'" />
      </div>
      <div class="text-sm text-gray-600">
        {{ entregasDentroFranja }} de {{ entregasTotales }} entregas dentro de la franja horaria.
      </div>
    </div>

    <!-- Buscador y filtro -->
    <div v-if="!cargando" class="flex gap-2 sm:flex-wrap">
      <input
        v-model="filtroBusqueda"
        type="text"
        placeholder="Buscar por curso..."
        class="input"
      />
      <select v-model="filtroFranja" class="input">
        <option value="todos">Todas</option>
        <option value="true">Dentro de franja</option>
        <option value="false">Fuera de franja</option>
      </select>
    </div>

    <div v-if="!cargando && entregasFiltradas.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Curso</th>
            <th>Fecha</th>
            <th>Franja horaria</th>
            <th>Observaciones</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in entregasFiltradas" :key="e.id">
            <td>{{ e.pedido_id }}</td>
            <td>{{ e.curso }}°</td>
            <td>{{ formatearFecha(e.fecha) }}</td>
            <td>
              <DataBadge :estado="e.dentro_franja ? 'dentro' : 'fuera'" />
            </td>
            <td>{{ e.observaciones || '—' }}</td>
            <td class="text-center">
              <button
                @click="editarEntrega(e)"
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
      v-if="!cargando && entregasFiltradas.length === 0"
      mensaje="No se registraron entregas."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar entrega' : 'Registrar nueva entrega' }}
      </h3>
      <form @submit.prevent="guardarEntrega" class="space-y-3">
        <div>
          <label class="label">Pedido</label>
          <select v-model="form.pedido_id" class="input" required>
            <option v-for="p in pedidosLista" :key="p.id" :value="p.id">
              Pedido {{ p.id }} - Curso {{ p.curso }}°
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
            <label class="label">¿Dentro de la franja horaria?</label>
            <select v-model="form.dentro_franja" class="input" required>
              <option value="true">Sí, dentro de franja</option>
              <option value="false">No, fuera de franja</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Fecha</label>
          <input v-model="form.fecha" type="date" class="input" required />
        </div>
        <div>
          <label class="label">Observaciones</label>
          <input
            v-model="form.observaciones"
            type="text"
            placeholder="Ej: Alumno ausente, retraso por lluvia..."
            class="input"
          />
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
import { entregasService, pedidosService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import DataBadge from '@/components/DataBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

const cargando = ref(false)
const errorCarga = ref(null)
const entregas = ref([])
const pedidosLista = ref([])

const filtroBusqueda = ref('')
const filtroFranja = ref('todos')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  pedido_id: '',
  curso: 1,
  dentro_franja: true,
  fecha: '',
  observaciones: '',
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
    const [resEntregas, resPedidos] = await Promise.all([
      entregasService.listar(),
      pedidosService.listar(),
    ])
    if (resEntregas.error) throw resEntregas.error
    if (resPedidos.error) throw resPedidos.error
    entregas.value = resEntregas.data || []
    pedidosLista.value = resPedidos.data || []
  } catch (e) {
    errorCarga.value = 'No se pudieron cargar las entregas: ' + e.message
  } finally {
    cargando.value = false
  }
}

const entregasFiltradas = computed(() => {
  let lista = entregas.value

  if (filtroFranja.value !== 'todos') {
    lista = lista.filter((e) => String(e.dentro_franja) === filtroFranja.value)
  }

  if (filtroBusqueda.value) {
    const q = filtroBusqueda.value.toLowerCase()
    lista = lista.filter((e) =>
      String(e.curso).includes(q) || String(e.pedido_id).includes(q)
    )
  }

  return lista
})

const entregasTotales = computed(() => entregas.value.length)
const entregasDentroFranja = computed(() =>
  entregas.value.filter((e) => e.dentro_franja).length
)

function formatearFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-AR')
}

function abrirFormulario(e = null) {
  editando.value = !!e
  if (e) {
    form.value = { ...e }
  } else {
    form.value = {
      id: null,
      pedido_id: '',
      curso: 1,
      dentro_franja: true,
      fecha: '',
      observaciones: '',
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

async function guardarEntrega() {
  errores.value = {}

  if (!form.value.pedido_id) errores.value.pedido_id = 'Seleccioná un pedido.'
  if (!form.value.fecha) errores.value.fecha = 'La fecha es obligatoria.'

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      pedido_id: form.value.pedido_id,
      curso: Number(form.value.curso),
      dentro_franja: form.value.dentro_franja === 'true' || form.value.dentro_franja === true,
      fecha: form.value.fecha,
      observaciones: form.value.observaciones || null,
    }

    if (editando.value) {
      const { error } = await entregasService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Entrega modificada correctamente.')
    } else {
      const { error } = await entregasService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Entrega registrada correctamente.')
    }
    await cargarDatos()
    cerrarFormulario()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo guardar: ' + e.message)
  } finally {
    guardando.value = false
  }
}

function editarEntrega(e) {
  abrirFormulario(e)
}

onMounted(() => {
  cargarDatos()
})
</script>
