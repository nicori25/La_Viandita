import { hoy } from "@/utils/format";
const f = (key, label, type = "text", extra = {}) => ({
  key,
  label,
  type,
  required: true,
  ...extra,
});
const opt = (values) => values.map((v) => ({ value: v, label: v }));
const ref = (key, label, table) => f(key, label, "select", { table });
const date = (key, label) => f(key, label, "date", { default: hoy });
const money = (key, label) =>
  f(key, label, "number", { min: 0, step: 0.01, default: 0, money: true });
const estado = f("activo", "Estado", "boolean", { default: true });
const curso = f("curso", "Curso", "number", {
  min: 1,
  max: 7,
  step: 1,
  default: 1,
});
const telefono = f("telefono", "Teléfono", "tel", { required: false });
export const modules = {
  Asociados: {
    table: "asociados",
    title: "Asociados",
    singular: "asociado",
    description: "Un registro organizado de quienes participan del servicio.",
    icon: "Users",
    next: "/suscripciones",
    nextLabel: "Continuar con una suscripción",
    status: "activo",
    fields: [
      f("nombre", "Nombre"),
      f("apellido", "Apellido"),
      curso,
      f("division", "División", "select", {
        options: opt(["1", "2", "3"]),
        default: "1",
      }),
      telefono,
      date("fecha_alta", "Fecha de alta"),
      estado,
    ],
    columns: [
      "nombre",
      "apellido",
      "curso",
      "division",
      "telefono",
      "fecha_alta",
      "activo",
    ],
    hint: "La suscripción de un estudiante se administra por separado. La baja conserva su historial.",
  },
  Suscripciones: {
    table: "suscripciones",
    title: "Suscripciones",
    singular: "suscripción",
    description: "Organizá las modalidades y la vigencia de cada suscripción.",
    icon: "CreditCard",
    next: "/pedidos",
    nextLabel: "Continuar con un pedido",
    status: "estado",
    fields: [
      ref("asociado_id", "Asociado", "asociados"),
      f("tipo", "Modalidad", "select", {
        options: opt(["semanal", "mensual"]),
        default: "semanal",
      }),
      date("fecha_inicio", "Inicio de vigencia"),
      date("fecha_fin", "Fin de vigencia"),
      money("monto", "Importe de la suscripción"),
      f("estado", "Estado", "select", {
        options: opt(["activa", "baja"]),
        default: "activa",
      }),
    ],
    columns: [
      "asociado_id",
      "tipo",
      "fecha_inicio",
      "fecha_fin",
      "monto",
      "estado",
    ],
    hint: "Registrar una suscripción no registra un cobro. Cargá el pago confirmado en Libro de caja y luego el pedido.",
  },
  MenuSemanal: {
    table: "menu_semanal",
    title: "Menú semanal",
    singular: "menú",
    description:
      "Planificá opciones, precios y características de las viandas.",
    icon: "Utensils",
    status: "activo",
    fields: [
      f("semana", "Semana o período"),
      ref("tipo_vianda_id", "Tipo de vianda", "tipos_vianda"),
      money("precio", "Precio por vianda"),
      f("celiaco", "Opción sin gluten", "boolean", { default: false }),
      f("vegetariano", "Opción vegetariana", "boolean", { default: false }),
      f("alergia", "Requiere control de alérgenos", "boolean", {
        default: false,
      }),
      f("otra_restriccion", "Aclaraciones alimentarias", "textarea", {
        required: false,
      }),
      estado,
    ],
    columns: [
      "semana",
      "tipo_vianda_id",
      "precio",
      "celiaco",
      "vegetariano",
      "otra_restriccion",
      "activo",
    ],
    hint: "Las etiquetas no certifican aptitud alimentaria. Verificá ingredientes, higiene y contaminación cruzada con el docente asesor.",
  },
  Pedidos: {
    table: "pedidos",
    title: "Pedidos",
    singular: "pedido",
    description: "De la suscripción a la vianda: prepará cada solicitud.",
    icon: "ShoppingBag",
    next: "/entregas",
    nextLabel: "Ir al registro de entregas",
    status: "estado",
    fields: [
      ref("suscripcion_id", "Suscripción", "suscripciones"),
      ref("menu_id", "Menú", "menu_semanal"),
      curso,
      f("cantidad", "Cantidad de viandas", "number", {
        min: 1,
        step: 1,
        default: 1,
      }),
      date("fecha", "Fecha del pedido"),
      f("estado", "Estado", "select", {
        options: opt(["pendiente", "cancelado"]),
        default: "pendiente",
        required: false,
      }),
    ],
    columns: [
      "suscripcion_id",
      "menu_id",
      "curso",
      "cantidad",
      "fecha",
      "estado",
    ],
    hint: "Solo se admiten suscripciones activas y vigentes en la fecha del pedido. Los pedidos se cancelan sin borrar el historial; un pedido ya entregado no puede cancelarse.",
  },
  Entregas: {
    table: "entregas",
    title: "Entregas",
    singular: "entrega",
    description: "Registrá el retiro y revisá la puntualidad del servicio.",
    icon: "PackageCheck",
    fields: [
      ref("pedido_id", "Pedido", "pedidos"),
      curso,
      date("fecha", "Fecha de entrega"),
      f("dentro_franja", "Entrega dentro del horario acordado", "boolean", {
        default: true,
      }),
      f("observaciones", "Observaciones", "textarea", { required: false }),
    ],
    columns: ["pedido_id", "curso", "fecha", "dentro_franja", "observaciones"],
    hint: "Registrá solo retiros efectivos. Si el estudiante está ausente, dejá el pedido pendiente; no crees una entrega. Cada pedido admite un registro de entrega.",
  },
  LibroCaja: {
    table: "libro_caja",
    title: "Libro de caja",
    singular: "movimiento",
    description: "Ingresos y egresos claros para rendir cuentas.",
    icon: "Wallet",
    fields: [
      f("tipo", "Tipo de movimiento", "select", {
        options: opt(["ingreso", "egreso"]),
        default: "ingreso",
      }),
      money("monto", "Importe"),
      f("concepto", "Concepto y referencia del comprobante"),
      date("fecha", "Fecha"),
      ref("usuario_id", "Responsable", "usuarios"),
    ],
    columns: ["tipo", "concepto", "monto", "fecha", "usuario_id"],
    hint: "Cada pago o gasto debe tener una referencia. Para rectificar un cobro, registrá un movimiento compensatorio y explicá el motivo; conservá los comprobantes.",
  },
  Tareas: {
    table: "tareas",
    title: "Tareas",
    singular: "tarea",
    description: "Cada comisión, con una tarea y un plazo claros.",
    icon: "ListChecks",
    status: "cumplida",
    fields: [
      ref("comision_id", "Comisión responsable", "comisiones"),
      f("descripcion", "Descripción de la tarea", "textarea"),
      date("fecha_asignada", "Fecha de asignación"),
      date("fecha_limite", "Fecha límite"),
      f("cumplida", "Tarea cumplida", "boolean", { default: false }),
      f("fecha_cumplimiento", "Fecha de cumplimiento", "date", {
        required: false,
      }),
    ],
    columns: [
      "descripcion",
      "comision_id",
      "fecha_limite",
      "cumplida",
      "fecha_cumplimiento",
    ],
    hint: "El indicador considera las tareas cuyo plazo cae en el período seleccionado y comprueba la fecha de cumplimiento.",
  },
  Actas: {
    table: "actas",
    title: "Actas",
    singular: "acta",
    description: "Acuerdos y decisiones que construimos entre todos.",
    icon: "NotebookPen",
    status: "aprobada",
    fields: [
      date("fecha", "Fecha de reunión"),
      f("tipo_reunion", "Tipo de reunión", "select", {
        options: opt(["asamblea", "consejo"]),
        default: "asamblea",
      }),
      f("contenido", "Contenido del acta", "textarea", {
        placeholder:
          "Número, hora y lugar; presentes; orden del día; propuestas; votos; decisiones; responsables, plazos y firmas.",
      }),
      f("aprobada", "Acta aprobada", "boolean", { default: false }),
      ref("usuario_id", "Responsable del registro", "usuarios"),
    ],
    columns: ["fecha", "tipo_reunion", "contenido", "aprobada", "usuario_id"],
    hint: "Aprobar el registro digital no reemplaza la votación ni las firmas exigidas por el reglamento. Documentá los votos y responsables en el contenido.",
  },
};
export function etiquetaRegistro(table, row, data) {
  if (!row) return "Registro no disponible";
  if (table === "asociados")
    return `${row.nombre} ${row.apellido} · ${row.curso}°${row.division}`;
  if (["usuarios", "comisiones", "tipos_vianda"].includes(table))
    return row.nombre;
  if (table === "menu_semanal")
    return `${data.tipos_vianda?.find((t) => t.id === row.tipo_vianda_id)?.nombre || "Vianda"} · ${row.semana}`;
  if (table === "suscripciones")
    return `${etiquetaRegistro(
      "asociados",
      data.asociados?.find((a) => a.id === row.asociado_id),
      data,
    )} · ${row.tipo} (${row.fecha_inicio} a ${row.fecha_fin || "sin fin"})`;
  if (table === "pedidos")
    return `${row.fecha} · ${row.cantidad} vianda(s) · ${etiquetaRegistro(
      "suscripciones",
      data.suscripciones?.find((s) => s.id === row.suscripcion_id),
      data,
    )}`;
  return row.id;
}
