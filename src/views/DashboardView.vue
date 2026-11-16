<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { puedeAcceder } from "@/utils/roles";
import { useAnalytics } from "@/composables/useAnalytics";
import { moneda, fecha } from "@/utils/format";
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
const shortcuts = computed(() =>
  [
    {
      to: "/pedidos",
      name: "Pedidos",
      label: "Organizar pedidos",
      icon: "ShoppingBag",
    },
    {
      to: "/entregas",
      name: "Entregas",
      label: "Registrar una entrega",
      icon: "PackageCheck",
    },
    {
      to: "/libro-caja",
      name: "LibroCaja",
      label: "Consultar la caja",
      icon: "Wallet",
    },
  ].filter((m) => puedeAcceder(auth.role, m.name)),
);
</script>
<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <div class="eyebrow">PANORAMA GENERAL</div>
        <h1>Así va nuestra cooperativa</h1>
        <p class="muted">
          Los datos nos ayudan a organizarnos y a tomar mejores decisiones.
        </p>
      </div>
      <RouterLink
        v-if="puedeAcceder(auth.role, 'Informe')"
        to="/informe"
        class="btn-secondary"
        ><Icon name="FileText" :size="17" />Ver informe</RouterLink
      >
    </div>
    <div class="welcome-banner">
      <div>
        <span class="welcome-label"
          ><span class="live-dot" />JUNTOS, CADA DÍA</span
        >
        <h2>Una buena comida.<br />Un proyecto compartido.</h2>
        <p>Planificamos, entregamos y aprendemos en comunidad.</p>
        <RouterLink to="/proyecto" class="banner-link"
          >Conocé La Viandita <Icon name="ArrowUpRight" :size="16"
        /></RouterLink>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="plate"><Icon name="Utensils" :size="68" /></div>
        <span class="art-leaf leaf-one">✦</span
        ><span class="art-leaf leaf-two">✦</span><span class="art-circle" />
      </div>
    </div>
    <PeriodFilter
      v-model:desde="desde"
      v-model:hasta="hasta"
      :loading="loading"
      :demo="auth.estaEnModoPrueba"
      @apply="load"
      @preset="preset"
    />
    <div v-if="loading" class="card empty-state" role="status">
      <span class="spinner" />Actualizando el tablero…
    </div>
    <div v-else-if="error" role="alert" class="alert alert-error">
      {{ error }} <button class="text-link" @click="load">Reintentar</button>
    </div>
    <template v-else-if="result"
      ><div class="section-line">
        <h2>Lo importante, de un vistazo</h2>
        <span>{{ fecha(desde) }} — {{ fecha(hasta) }}</span>
      </div>
      <MetricCards :cards="cards" />
      <div class="analytics-grid">
        <BarChart v-bind="charts[0]" />
        <article class="card balance-card">
          <span class="eyebrow">BALANCE DEL PERÍODO</span>
          <h2>Los recursos del proyecto</h2>
          <div class="balance-value">
            {{ moneda(result.ingresos - result.egresos) }}
          </div>
          <span
            class="status-pill"
            :class="result.ingresos - result.egresos >= 0 ? 'positive' : 'rojo'"
            >{{
              result.ingresos - result.egresos >= 0
                ? "Diferencia positiva"
                : "Diferencia negativa"
            }}</span
          >
          <p class="muted">
            Ingresos menos egresos registrados. Conciliar comprobantes antes de
            presentar la rendición.
          </p>
          <div class="balance-detail">
            <span>Viandas pedidas</span><strong>{{ result.pedidos }}</strong>
          </div>
          <RouterLink
            v-if="puedeAcceder(auth.role, 'LibroCaja')"
            to="/libro-caja"
            class="text-link"
            >Abrir libro de caja →</RouterLink
          >
        </article>
      </div>
      <div class="two-columns">
        <BarChart v-bind="charts[1]" /><BarChart v-bind="charts[2]" />
      </div>
      <div class="two-columns">
        <article class="card">
          <div class="section-line">
            <h2>Próximos pasos</h2>
            <Icon name="Sprout" />
          </div>
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
        </article>
        <article class="card">
          <h2>Todo conectado</h2>
          <p class="muted mt-2">
            De una solicitud a la entrega, cada registro tiene su lugar.
          </p>
          <div class="shortcut-list">
            <RouterLink v-for="item in shortcuts" :key="item.to" :to="item.to"
              ><span class="shortcut-icon"><Icon :name="item.icon" /></span
              ><span>{{ item.label }}</span
              ><Icon name="ArrowRight" :size="17" /></RouterLink
            ><RouterLink v-if="!shortcuts.length" to="/menu-semanal"
              ><Icon name="Utensils" />Consultar el menú
              <Icon name="ArrowRight"
            /></RouterLink>
          </div>
          <div class="soft-note">
            <Icon name="HeartHandshake" :size="19" />
            <p>
              Ayuda mutua, responsabilidad y participación: nuestros datos
              también cuentan esa historia.
            </p>
          </div>
        </article>
      </div>
      <p class="update-note">
        <Icon name="RefreshCw" :size="13" />Actualizado: {{ updated }} · Al
        ingresar o aplicar el filtro.
        <span>{{
          auth.estaEnModoPrueba
            ? "Fuente: registros de demostración guardados en este navegador."
            : "Fuente: registros de Supabase."
        }}</span>
      </p>
      <p class="helper">
        Las suscripciones vigentes no acreditan pago. Los registros de entrega
        del ejemplo incluyen una ausencia que debe revisarse antes de evaluar el
        servicio real.
      </p>
    </template>
  </section>
</template>
