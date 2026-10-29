<template>
  <div class="space-y-6">
    <div v-if="modoPrueba" class="datos-prueba">
      ⚠️ Modo datos de prueba. Los KPI se calculan con datos ficticios.
    </div>

    <div v-if="cargando" class="text-center py-8">
      <LoadingSpinner mensaje="Cargando indicadores..." />
    </div>

    <div v-if="errorCarga" class="alert alert-error">
      {{ errorCarga }}
    </div>

    <h1 v-if="!cargando" class="text-2xl font-bold text-gray-800">Tablero de indicadores (KPI)</h1>
    <p v-if="!cargando" class="text-sm text-gray-600">
      El tablero muestra solo totales, sin datos personales de asociados.
    </p>

    <div v-if="!cargando" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        titulo="Margen mensual"
        :valor="kpiMargen.valor !== null ? kpiMargen.valor + '%' : '—'"
        meta="10%"
        :estado="kpiMargen.estado"
        :etiqueta="kpiMargen.etiqueta"
        subtitulo="Meta: 10% o más. &gt;20%: Revisar precio."
      />
      <KpiCard
        titulo="Suscriptos activos"
        :valor="kpiSuscriptos.valor"
        :meta="kpiSuscriptos.meta"
        :estado="kpiSuscriptos.estado"
        :etiqueta="kpiSuscriptos.etiqueta"
        subtitulo="Meta: 40 en la semana 8."
      />
      <KpiCard
        titulo="Entregas en horario"
        :valor="kpiEntregas.valor !== null ? kpiEntregas.valor + '%' : '—'"
        meta="95%"
        :estado="kpiEntregas.estado"
        :etiqueta="kpiEntregas.etiqueta"
        subtitulo="Meta: 95% o más."
      />
      <KpiCard
        titulo="Cumplimiento de tareas"
        :valor="kpiTareas.valor !== null ? kpiTareas.valor + '%' : '—'"
        meta="85%"
        :estado="kpiTareas.estado"
        :etiqueta="kpiTareas.etiqueta"
        subtitulo="Meta: 85% o más."
      />
    </div>

    <!-- Resumen rápido -->
    <div v-if="!cargando" class="card mt-6">
      <h3 class="text-sm font-semibold text-gray-500 mb-3">Resumen de la semana</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div class="text-gray-500 text-xs uppercase">Ingresos</div>
          <div class="text-lg font-bold">$ {{ totalIngresos }}</div>
        </div>
        <div>
          <div class="text-gray-500 text-xs uppercase">Egresos</div>
          <div class="text-lg font-bold">$ {{ totalEgresos }}</div>
        </div>
        <div>
          <div class="text-gray-500 text-xs uppercase">Entregas totales</div>
          <div class="text-lg font-bold">{{ entregasTotales }}</div>
        </div>
        <div>
          <div class="text-gray-500 text-xs uppercase">Tareas asignadas</div>
          <div class="text-lg font-bold">{{ tareasAsignadas }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  calcularMargenMensual,
  calcularSuscriptosActivos,
  calcularEntregasHorario,
  calcularCumplimientoTareas,
} from '@/utils/kpi'
import {
  obtenerResumenCaja,
  contarSuscripcionesActivas,
  obtenerEstadisticasEntregas,
  obtenerEstadisticasTareas,
} from '@/services/db'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import KpiCard from '@/components/KpiCard.vue'

const authStore = useAuthStore()
const modoPrueba = computed(() => authStore.estaEnModoPrueba)

const cargando = ref(false)
const errorCarga = ref(null)

// Datos de prueba (fallback)
import {
  LIBRO_CAJA_MOCK,
  SUSCRIPCIONES_MOCK,
  ENTREGAS_MOCK,
  TAREAS_MOCK,
} from '@/data/mockData'

// Cálculos de KPI (reactivos)
const kpiMargen = ref({ valor: null, estado: 'rojo', etiqueta: 'no calculable', color: 'badge-rojo', cumpleMeta: false })
const kpiSuscriptos = ref({ valor: 0, meta: 40, porcentaje: 0, estado: 'rojo', etiqueta: 'Crítico', color: 'badge-rojo', cumpleMeta: false })
const kpiEntregas = ref({ valor: null, estado: 'rojo', etiqueta: 'no calculable', color: 'badge-rojo', cumpleMeta: false })
const kpiTareas = ref({ valor: null, estado: 'rojo', etiqueta: 'no calculable', color: 'badge-rojo', cumpleMeta: false })

const totalIngresos = ref('$ 0,00')
const totalEgresos = ref('$ 0,00')
const entregasTotales = ref(0)
const tareasAsignadas = ref(0)

async function cargarKPIs() {
  cargando.value = true
  errorCarga.value = null

  try {
    if (modoPrueba.value) {
      // --- Modo prueba: datos ficticios ---
      const ingresos = LIBRO_CAJA_MOCK
        .filter((m) => m.tipo === 'ingreso')
        .reduce((s, m) => s + Number(m.monto), 0)
      const egresos = LIBRO_CAJA_MOCK
        .filter((m) => m.tipo === 'egreso')
        .reduce((s, m) => s + Number(m.monto), 0)
      kpiMargen.value = calcularMargenMensual(ingresos, egresos)

      const suscriptosActivos = SUSCRIPCIONES_MOCK.filter((s) => s.estado === 'activa').length
      kpiSuscriptos.value = calcularSuscriptosActivos(suscriptosActivos)

      const totalesE = ENTREGAS_MOCK.length
      const dentroE = ENTREGAS_MOCK.filter((e) => e.dentro_franja).length
      kpiEntregas.value = calcularEntregasHorario(dentroE, totalesE)

      const asignadasT = TAREAS_MOCK.length
      const cumplidasT = TAREAS_MOCK.filter((t) => t.cumplida).length
      kpiTareas.value = calcularCumplimientoTareas(cumplidasT, asignadasT)

      totalIngresos.value = ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      totalEgresos.value = egresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      entregasTotales.value = totalesE
      tareasAsignadas.value = asignadasT
    } else {
      // --- Modo Supabase: consultas reales ---
      const resumenCaja = await obtenerResumenCaja()
      if (resumenCaja.error) throw resumenCaja.error
      kpiMargen.value = calcularMargenMensual(resumenCaja.ingresos, resumenCaja.egresos)
      totalIngresos.value = resumenCaja.ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      totalEgresos.value = resumenCaja.egresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

      const suscriptos = await contarSuscripcionesActivas()
      if (suscriptos.error) throw suscriptos.error
      kpiSuscriptos.value = calcularSuscriptosActivos(suscriptos.count)

      const entregas = await obtenerEstadisticasEntregas()
      if (entregas.error) throw entregas.error
      kpiEntregas.value = calcularEntregasHorario(entregas.dentroFranja, entregas.totales)
      entregasTotales.value = entregas.totales

      const tareas = await obtenerEstadisticasTareas()
      if (tareas.error) throw tareas.error
      kpiTareas.value = calcularCumplimientoTareas(tareas.cumplidas, tareas.asignadas)
      tareasAsignadas.value = tareas.asignadas
    }
  } catch (error) {
    errorCarga.value = 'No se pudieron cargar los indicadores: ' + error.message
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarKPIs()
})
</script>
