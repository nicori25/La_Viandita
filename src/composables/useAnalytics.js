import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { obtenerResumen } from "@/services/db";
import { useAuthStore } from "@/stores/auth";
import {
  calcularMargenMensual,
  calcularSuscriptosActivos,
  calcularEntregasHorario,
  calcularCumplimientoTareas,
} from "@/utils/kpi";
import { hoy, moneda } from "@/utils/format";
export function useAnalytics() {
  const auth = useAuthStore();
  const current = hoy();
  const desde = ref(
      auth.estaEnModoPrueba ? "2026-03-01" : current.slice(0, 7) + "-01",
    ),
    hasta = ref(auth.estaEnModoPrueba ? "2026-03-31" : current);
  const result = ref(null),
    loading = ref(false),
    error = ref(""),
    updated = ref("");
  let sequence = 0;
  const cards = computed(() => {
    const d = result.value;
    if (!d) return [];
    return [
      {
        title: "Margen del período",
        icon: "Wallet",
        ...calcularMargenMensual(d.ingresos, d.egresos),
        unit: "%",
        goal: "Meta ≥ 10%",
        detail:
          d.ingresos > 0
            ? "Revisar el precio si supera el 20%."
            : "Sin ingresos en este período.",
      },
      {
        title: "Suscriptores vigentes",
        icon: "Users",
        ...calcularSuscriptosActivos(d.vigentes),
        unit: "",
        goal: "Referencia: 40 al final de semana 8",
        detail: "Personas distintas al cierre; pago no verificado.",
      },
      {
        title: "Entregas en horario",
        icon: "PackageCheck",
        ...calcularEntregasHorario(d.enHorario, d.entregas),
        unit: "%",
        goal: "Meta ≥ 95%",
        detail: d.entregas
          ? `${d.enHorario} de ${d.entregas} entregas registradas.`
          : "Sin entregas registradas en este período.",
      },
      {
        title: "Tareas en plazo",
        icon: "ListChecks",
        ...calcularCumplimientoTareas(d.cumplidas, d.tareas),
        unit: "%",
        goal: "Meta ≥ 85%",
        detail: d.tareas
          ? `${d.cumplidas} de ${d.tareas} tareas con vencimiento en el período.`
          : "Sin tareas con vencimiento en este período.",
      },
    ];
  });
  const charts = computed(() => {
    const d = result.value;
    if (!d) return [];
    return [
      {
        title: "El movimiento de nuestra caja",
        subtitle: "Ingresos y egresos del período",
        unit: "Pesos argentinos",
        items: [
          {
            label: "Ingresos",
            value: d.ingresos,
            color: "green",
            display: moneda(d.ingresos),
          },
          {
            label: "Egresos",
            value: d.egresos,
            color: "ochre",
            display: moneda(d.egresos),
          },
        ],
      },
      {
        title: "Cada entrega cuenta",
        subtitle: `Puntualidad · ${d.entregas} registros`,
        unit: "Entregas",
        items: [
          { label: "En horario", value: d.enHorario, color: "green" },
          {
            label: "Fuera de horario",
            value: d.entregas - d.enHorario,
            color: "ochre",
          },
        ],
      },
      {
        title: "Compromisos de las comisiones",
        subtitle: `Vencimientos del período · ${d.tareas} tareas`,
        unit: "Tareas",
        items: [
          { label: "Cumplidas en plazo", value: d.cumplidas, color: "green" },
          {
            label: "Fuera de plazo o pendientes",
            value: d.tareas - d.cumplidas,
            color: "ochre",
          },
        ],
      },
    ];
  });
  const actions = computed(() => {
    const d = result.value;
    if (!d) return [];
    const a = [];
    if (!d.entregas)
      a.push({
        title: "Completar el registro de entregas",
        text: "Distribución: registrar cada retiro efectivo para poder evaluar puntualidad.",
      });
    else if (d.enHorario / d.entregas < 0.95)
      a.push({
        title: "Revisar los horarios de retiro",
        text: "Distribución: preparar la lista antes del recreo, revisar las causas de atraso y comparar el resultado la próxima semana.",
      });
    else
      a.push({
        title: "Sostener la puntualidad",
        text: "Distribución: mantener turnos y verificar que todos los retiros queden registrados.",
      });
    if (d.ingresos > 0 && (d.ingresos - d.egresos) / d.ingresos > 0.2)
      a.push({
        title: "Revisar costos y precio",
        text: "Tesorero y Compras: conciliar comprobantes y costos completos. Proponer ajustes a la Asamblea; no cambiar el precio automáticamente.",
      });
    else
      a.push({
        title: "Conciliar caja y suscripciones",
        text: "Administración y Tesorero: verificar pagos y comprobantes antes de evaluar sostenibilidad y ahorro.",
      });
    if (d.tareas && d.cumplidas / d.tareas < 0.85)
      a.push({
        title: "Acordar nuevos responsables y plazos",
        text: "Coordinadores: revisar tareas pendientes y cierres tardíos, priorizando los controles de higiene.",
      });
    return a;
  });
  async function load() {
    const id = ++sequence;
    error.value = "";
    result.value = null;
    if (!desde.value || !hasta.value || desde.value > hasta.value) {
      loading.value = false;
      error.value =
        "Elegí un período válido: la fecha de inicio debe ser anterior o igual al cierre.";
      return;
    }
    loading.value = true;
    try {
      const data = await obtenerResumen(desde.value, hasta.value);
      if (id !== sequence) return;
      result.value = data;
      updated.value = new Date().toLocaleString("es-AR");
    } catch (e) {
      if (id === sequence)
        error.value = "No se pudo actualizar la información: " + e.message;
    } finally {
      if (id === sequence) loading.value = false;
    }
  }
  watch(
    [desde, hasta],
    () => {
      sequence++;
      result.value = null;
      updated.value = "";
      loading.value = false;
      error.value = "Aplicá el período para actualizar los resultados.";
    },
    { flush: "sync" },
  );
  function preset(which) {
    if (which === "demo") {
      desde.value = "2026-03-01";
      hasta.value = "2026-03-31";
    } else {
      desde.value = current.slice(0, 7) + "-01";
      hasta.value = current;
    }
    load();
  }
  function changed() {
    load();
  }
  onMounted(() => {
    load();
    window.addEventListener("viandita-data", changed);
  });
  onBeforeUnmount(() => {
    sequence++;
    window.removeEventListener("viandita-data", changed);
  });
  return {
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
  };
}
