<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los cambios no se guardan permanentemente.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando menú semanal..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <div v-if="!cargando" class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Menú semanal</h1>
      <button @click="abrirFormulario()" class="btn-primary" :disabled="!puedeEscribir">
        + Nueva opción de menú
      </button>
    </div>

    <Alert v-if="alerta" :tipo="alerta.tipo" :mensaje="alerta.mensaje" />

    <!-- Buscador por semana -->
    <div v-if="!cargando" class="flex gap-2">
      <input
        v-model="filtroSemana"
        type="text"
        placeholder="Buscar semana..."
        class="input"
      />
    </div>

    <div v-if="!cargando && menuFiltrado.length > 0" class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Semana</th>
            <th>Tipo de vianda</th>
            <th>Celiaco</th>
            <th>Vegetariano</th>
            <th>Alergia</th>
            <th>Otra restricción</th>
            <th>Precio</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in menuFiltrado" :key="m.id">
            <td>{{ m.semana }}</td>
            <td>{{ tipoVianda(m.tipo_vianda_id) }}</td>
            <td class="text-center">{{ m.celiaco ? 'Sí' : 'No' }}</td>
            <td class="text-center">{{ m.vegetariano ? 'Sí' : 'No' }}</td>
            <td class="text-center">{{ m.alergia ? 'Sí' : 'No' }}</td>
            <td>{{ m.otra_restriccion || '—' }}</td>
            <td>$ {{ Number(m.precio).toLocaleString('es-AR') }}</td>
            <td class="text-center">
              <button
                @click="editarMenu(m)"
                class="text-blue-600 hover:text-blue-800 text-sm"
                :disabled="!puedeEscribir"
              >
                Editar
              </button>
              <button
                @click="confirmarEliminar(m)"
                class="text-red-600 hover:text-red-800 text-sm ml-3"
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
      v-if="!cargando && menuFiltrado.length === 0"
      mensaje="No se encontraron opciones de menú."
    />

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card mt-4">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">
        {{ editando ? 'Editar menú' : 'Nueva opción de menú' }}
      </h3>
      <form @submit.prevent="guardarMenu" class="space-y-3">
        <div>
          <label class="label">Semana</label>
          <input
            v-model="form.semana"
            type="text"
            placeholder="Ej: Semana 1 (02/03 - 06/03)"
            class="input"
            required
          />
        </div>
        <div>
          <label class="label">Tipo de vianda</label>
          <select v-model="form.tipo_vianda_id" class="input" required>
            <option v-for="t in tiposViandaLista" :key="t.id" :value="t.id">
              {{ t.nombre }}
            </option>
          </select>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="label">Celiaco</label>
            <select v-model="form.celiaco" class="input">
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
          <div>
            <label class="label">Vegetariano</label>
            <select v-model="form.vegetariano" class="input">
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
          <div>
            <label class="label">Alergia</label>
            <select v-model="form.alergia" class="input">
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Otra restricción</label>
          <input
            v-model="form.otra_restriccion"
            type="text"
            placeholder="Ej: Sin frutos secos"
            class="input"
          />
        </div>
        <div>
          <label class="label">Precio</label>
          <input
            v-model="form.precio"
            type="number"
            min="0"
            step="0.01"
            class="input"
            required
          />
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button @click="cerrarFormulario()" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-success" :disabled="guardando">Guardar</button>
        </div>
      </form>
    </div>

    <ConfirmDialog
      :abierto="dialogoEliminarAbierto"
      titulo="¿Eliminar opción de menú?"
      :mensaje="`¿Estás seguro de eliminar la opción de menú para ${menuSeleccionado?.semana}?`"
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
import { menuSemanalService, tiposViandaService } from '@/services/db'
import Alert from '@/components/Alert.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)
const puedeEscribir = computed(() => authStore.puedeEscribir)

const cargando = ref(false)
const errorCarga = ref(null)
const menu = ref([])
const tiposViandaLista = ref([])

const filtroSemana = ref('')

const mostrarFormulario = ref(false)
const editando = ref(false)
const guardando = ref(false)
const form = ref({
  id: null,
  semana: '',
  tipo_vianda_id: '',
  celiaco: false,
  vegetariano: false,
  alergia: false,
  otra_restriccion: '',
  precio: '',
})
const errores = ref({})

const dialogoEliminarAbierto = ref(false)
const menuSeleccionado = ref(null)
const alerta = ref(null)

function mostrarAlerta(tipo, mensaje) {
  alerta.value = { tipo, mensaje }
  setTimeout(() => { alerta.value = null }, 4000)
}

async function cargarDatos() {
  cargando.value = true
  errorCarga.value = null
  try {
    const [resMenu, resTipos] = await Promise.all([
      menuSemanalService.listar(),
      tiposViandaService.listar(),
    ])
    if (resMenu.error) throw resMenu.error
    if (resTipos.error) throw resTipos.error
    menu.value = resMenu.data || []
    tiposViandaLista.value = resTipos.data || []
  } catch (e) {
    errorCarga.value = 'No se pudo cargar el menú: ' + e.message
  } finally {
    cargando.value = false
  }
}

const menuFiltrado = computed(() => {
  let lista = menu.value
  if (filtroSemana.value) {
    const q = filtroSemana.value.toLowerCase()
    lista = lista.filter((m) => m.semana.toLowerCase().includes(q))
  }
  return lista
})

function tipoVianda(idTipo) {
  const t = tiposViandaLista.value.find((x) => x.id === idTipo)
  return t ? t.nombre : '—'
}

function abrirFormulario(m = null) {
  editando.value = !!m
  if (m) {
    form.value = { ...m }
  } else {
    form.value = {
      id: null,
      semana: '',
      tipo_vianda_id: '',
      celiaco: false,
      vegetariano: false,
      alergia: false,
      otra_restriccion: '',
      precio: '',
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

async function guardarMenu() {
  errores.value = {}

  if (!form.value.semana) errores.value.semana = 'La semana es obligatoria.'
  if (!form.value.tipo_vianda_id) errores.value.tipo_vianda_id = 'Seleccioná un tipo de vianda.'
  if (!form.value.precio || Number(form.value.precio) < 0) {
    errores.value.precio = 'Ingresá un precio válido.'
  }

  if (Object.keys(errores.value).length > 0) return

  guardando.value = true
  try {
    const payload = {
      semana: form.value.semana,
      tipo_vianda_id: form.value.tipo_vianda_id,
      celiaco: form.value.celiaco === 'true' || form.value.celiaco === true,
      vegetariano: form.value.vegetariano === 'true' || form.value.vegetariano === true,
      alergia: form.value.alergia === 'true' || form.value.alergia === true,
      otra_restriccion: form.value.otra_restriccion || null,
      precio: Number(form.value.precio),
    }

    if (editando.value) {
      const { error } = await menuSemanalService.actualizar(form.value.id, payload)
      if (error) throw error
      mostrarAlerta('success', 'Menú modificado correctamente.')
    } else {
      const { error } = await menuSemanalService.crear(payload)
      if (error) throw error
      mostrarAlerta('success', 'Opción de menú creada correctamente.')
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
  menuSeleccionado.value = m
  dialogoEliminarAbierto.value = true
}

async function ejecutarEliminar() {
  if (!menuSeleccionado.value) return
  try {
    const { error } = await menuSemanalService.eliminar(menuSeleccionado.value.id)
    if (error) throw error
    mostrarAlerta('success', 'Opción de menú eliminada correctamente.')
    await cargarDatos()
  } catch (e) {
    mostrarAlerta('error', 'No se pudo eliminar: ' + e.message)
  } finally {
    dialogoEliminarAbierto.value = false
    menuSeleccionado.value = null
  }
}

function editarMenu(m) {
  abrirFormulario(m)
}

onMounted(() => {
  cargarDatos()
})
</script>
