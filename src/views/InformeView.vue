<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAnalytics } from "@/composables/useAnalytics";
import { fecha, moneda } from "@/utils/format";
import PeriodFilter from "@/components/PeriodFilter.vue";
import MetricCards from "@/components/MetricCards.vue";
import BarChart from "@/components/BarChart.vue";
import Icon from "@/components/Icon.vue";
const auth = useAuthStore();
const {
  desde,
  hasta,
  result,
  loading,
  error,
  updated,
  cards,
  charts,
  actions,
  load,
  preset,
} = useAnalytics();
const notes = ref("");
function print() {
  window.print();
}
</script>
<template>
  <section class="page-stack report-view">
    <div class="page-heading">
      <div>
        <div class="eyebrow">ANÁLISIS Y RENDICIÓN</div>
        <h1>Informe de seguimiento</h1>
        <p class="muted">
          Un período, sus resultados y los acuerdos para seguir mejorando.
        </p>
      </div>
      <button
        class="btn-primary no-print"
        :disabled="!result || loading || !!error"
        @click="print"
      >
        <Icon name="Printer" :size="18" />Imprimir / guardar PDF
      </button>
    </div>
    <PeriodFilter
      v-model:desde="desde"
      v-model:hasta="hasta"
      :demo="auth.estaEnModoPrueba"
      :loading="loading"
      @apply="load"
      @preset="preset"
    />
    <div v-if="loading" role="status" class="card empty-state">
      <span class="spinner" />Preparando informe…
    </div>
    <div v-else-if="error" class="alert alert-error" role="alert">
      {{ error }} <button class="text-link" @click="load">Reintentar</button>
    </div>
    <template v-else-if="result"
      ><article class="card report-intro">
        <div class="section-line">
          <div>
            <span class="eyebrow">LA VIANDITA · PRECOOPERATIVA ESCOLAR</span>
            <h2>Seguimiento de gestión</h2>
          </div>
          <span class="status-pill quiet">{{
            auth.estaEnModoPrueba ? "DATOS SIMULADOS" : "REGISTROS DEL SERVICIO"
          }}</span>
        </div>
        <dl class="report-meta">
          <div>
            <dt>Período</dt>
            <dd>{{ fecha(desde) }} al {{ fecha(hasta) }}</dd>
          </div>
          <div>
            <dt>Elaborado</dt>
            <dd>{{ updated }}</dd>
          </div>
          <div>
            <dt>Destinatarios</dt>
            <dd>Consejo, comisiones y supervisión escolar</dd>
          </div>
          <div>
            <dt>Frecuencia propuesta</dt>
            <dd>Semanal y rendición mensual</dd>
          </div>
        </dl>
        <p>
          <strong>Objetivo:</strong> revisar la sostenibilidad, la puntualidad y
          el cumplimiento de compromisos para acordar mejoras.
        </p>
        <p class="helper">
          Fuente:
          {{
            auth.estaEnModoPrueba
              ? "datos ficticios y modificaciones locales del navegador"
              : "base de datos Supabase"
          }}. El informe contiene totales y no incluye información personal. Las
          observaciones se redactan para este informe y se incorporan a la
          impresión.
        </p>
      </article>
      <MetricCards :cards="cards" />
      <article class="card">
        <h2>Resultados del período</h2>
        <div class="table-scroll mt-4">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Indicador</th>
                <th scope="col">Resultado</th>
                <th scope="col">Meta</th>
                <th scope="col">Interpretación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cards" :key="c.title">
                <td>{{ c.title }}</td>
                <td>
                  {{
                    c.valor === null
                      ? "No calculable"
                      : c.valor.toLocaleString("es-AR") + c.unit
                  }}
                </td>
                <td>{{ c.goal }}</td>
                <td>{{ c.etiqueta }}. {{ c.detail }}</td>
              </tr>
              <tr>
                <td>Ingresos / egresos</td>
                <td>
                  {{ moneda(result.ingresos) }} / {{ moneda(result.egresos) }}
                </td>
                <td>Conciliar comprobantes</td>
                <td>
                  Diferencia: {{ moneda(result.ingresos - result.egresos) }}. No
                  equivale a utilidad contable auditada.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      <div class="two-columns">
        <BarChart v-bind="charts[0]" /><BarChart v-bind="charts[1]" />
      </div>
      <BarChart v-bind="charts[2]" />
      <article class="card">
        <h2>Lectura y acciones de mejora</h2>
        <div
          v-for="(action, i) in actions"
          :key="action.title"
          class="action-item"
        >
          <span class="action-number">0{{ i + 1 }}</span>
          <div>
            <h3>{{ action.title }}</h3>
            <p>{{ action.text }}</p>
          </div>
        </div>
        <p class="helper">
          No se puede concluir sobre ahorro o satisfacción sin comparar precios
          equivalentes y realizar encuestas. La referencia de 40 suscriptores
          requiere fijar la semana de inicio y validar la capacidad del
          servicio.
        </p>
      </article>
      <article class="card">
        <h2>Observaciones y acuerdos</h2>
        <label class="label no-print mt-3" for="report-notes"
          >Agregá la interpretación del equipo antes de imprimir</label
        ><textarea
          id="report-notes"
          v-model="notes"
          rows="5"
          class="input no-print"
          placeholder="Dificultades, decisiones de Asamblea, responsables y fecha de revisión…"
        />
        <p class="print-only whitespace-pre-wrap">
          {{ notes || "Sin observaciones adicionales." }}
        </p>
      </article>
      <p class="helper">
        Cálculo: margen sobre ingresos positivos; suscriptores distintos
        vigentes al cierre; entregas en franja sobre entregas registradas;
        tareas cumplidas antes del plazo sobre tareas con vencimiento en el
        período. Los períodos sin registros muestran “No calculable”.
      </p>
    </template>
  </section>
</template>
