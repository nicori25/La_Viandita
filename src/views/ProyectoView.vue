<script setup>
import BrandLogo from "@/components/BrandLogo.vue";
import { useAuthStore } from "@/stores/auth";
import { MODULOS, puedeAcceder } from "@/utils/roles";
const auth = useAuthStore();
const visible = (path) =>
  puedeAcceder(auth.role, MODULOS.find((m) => m.path === path)?.name);
import Icon from "@/components/Icon.vue";
const steps = [
  [
    "01",
    "Asociados",
    "Registrá al estudiante con los datos necesarios para organizar el servicio.",
    "/asociados",
  ],
  [
    "02",
    "Suscripciones",
    "Elegí modalidad, importe y fechas de vigencia.",
    "/suscripciones",
  ],
  [
    "03",
    "Libro de caja",
    "Registrá el pago confirmado y la referencia del comprobante.",
    "/libro-caja",
  ],
  [
    "04",
    "Menú y pedidos",
    "Definí las opciones y vinculá el pedido con una suscripción vigente.",
    "/pedidos",
  ],
  [
    "05",
    "Entregas",
    "Registrá cada retiro efectivo e indicá si fue dentro de la franja acordada.",
    "/entregas",
  ],
  [
    "06",
    "Seguimiento",
    "Revisá el período, sus indicadores y las acciones de mejora.",
    "/informe",
  ],
];
</script>
<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <div class="eyebrow">NUESTRA IDENTIDAD</div>
        <h1>Una cooperativa que se construye en equipo</h1>
        <p class="muted">
          Viandas accesibles. Responsabilidades compartidas. Aprendizajes
          reales.
        </p>
      </div>
      <BrandLogo variant="project" />
    </div>
    <article class="card project-intro">
      <h2>¿Qué necesidad queremos resolver?</h2>
      <p>
        Que los estudiantes cuenten con una comida accesible y práctica durante
        la jornada escolar. La Viandita propone viandas con suscripción semanal
        o mensual y pago anticipado para planificar compras, preparación y
        distribución.
      </p>
      <div class="project-values">
        <span><Icon name="HeartHandshake" />Ayuda mutua</span
        ><span><Icon name="Users" />Participación democrática</span
        ><span><Icon name="ShieldCheck" />Responsabilidad</span>
      </div>
    </article>
    <div class="two-columns">
      <article class="card">
        <h2>Cómo nos organizamos</h2>
        <div class="action-item">
          <span class="action-number">01</span>
          <div>
            <h3>Asamblea</h3>
            <p>
              Máxima autoridad. Un asociado, un voto. Cambios de precio y
              destino de excedentes requieren dos tercios.
            </p>
          </div>
        </div>
        <div class="action-item">
          <span class="action-number">02</span>
          <div>
            <h3>Consejo y comisiones</h3>
            <p>
              Administración, Compras, Producción, Distribución, Comunicación y
              Control e higiene coordinan las tareas.
            </p>
          </div>
        </div>
        <div class="action-item">
          <span class="action-number">03</span>
          <div>
            <h3>Acompañamiento escolar</h3>
            <p>
              El docente asesora y supervisa la seguridad alimentaria. La
              dirección autoriza espacios y actividades.
            </p>
          </div>
        </div>
      </article>
      <article class="card">
        <h2>Qué está funcionando</h2>
        <ul class="project-list">
          <li>Gestión de asociados, suscripciones, menú y pedidos.</li>
          <li>Registro de entregas, caja, tareas y actas.</li>
          <li>Tablero con tres visualizaciones y filtro de período.</li>
          <li>Informe de seguimiento imprimible y exportación CSV.</li>
          <li>Conservación local y respaldo JSON en la demostración.</li>
        </ul>
        <p class="soft-note">
          La simulación usa datos ficticios. Supabase requiere configurar un
          proyecto y aplicar las políticas del repositorio; la operación
          alimentaria y las encuestas todavía deben realizarse y autorizarse.
        </p>
      </article>
    </div>
    <article class="card">
      <h2>Una tarea, de principio a fin</h2>
      <p class="muted mt-2">
        Recorrido sugerido para Administración. Registrar una suscripción no
        cobra dinero ni genera automáticamente un pedido.
      </p>
      <ol class="workflow-grid">
        <li v-for="[n, title, body, path] in steps" :key="n">
          <span class="action-number">{{ n }}</span>
          <h3>{{ title }}</h3>
          <p>{{ body }}</p>
          <RouterLink v-if="visible(path)" :to="path" class="text-link"
            >Abrir apartado →</RouterLink
          >
        </li>
      </ol>
    </article>
    <article class="card">
      <h2>Datos, decisiones y límites</h2>
      <p class="muted mt-3">
        Un cliente del servicio, un asociado de la precooperativa y un usuario
        del sistema son conceptos distintos. Este prototipo vincula
        suscripciones con el registro de estudiantes; no acredita membresía
        cooperativa ni votación. Antes de registrar información real, validar la
        autorización institucional, el acceso por roles y las políticas de
        Supabase.
      </p>
      <p class="muted mt-3">
        El margen no demuestra ahorro ni satisfacción. Para medir impacto se
        deben relevar precios equivalentes, preferencias y opiniones. La muestra
        propuesta es de cinco estudiantes por división: si las divisiones tienen
        tamaños diferentes, se requiere ponderación o asignación proporcional.
      </p>
    </article>
  </section>
</template>
