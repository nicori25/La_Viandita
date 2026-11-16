export const ROLES = [
  {
    id: "administracion",
    nombre: "Administración",
    descripcion: "Gestión completa del servicio",
  },
  {
    id: "tesorero",
    nombre: "Tesorero",
    descripcion: "Suscripciones, caja e informes",
  },
  {
    id: "distribucion",
    nombre: "Distribución",
    descripcion: "Pedidos y entregas",
  },
  {
    id: "secretario",
    nombre: "Secretario",
    descripcion: "Asociados, tareas y actas",
  },
  {
    id: "asociado",
    nombre: "Asociado",
    descripcion: "Indicadores generales y menú",
  },
  {
    id: "docente_asesor",
    nombre: "Docente asesor",
    descripcion: "Supervisión y consulta",
  },
  { id: "director", nombre: "Director", descripcion: "Supervisión y consulta" },
];
export const MODULOS = [
  {
    name: "Dashboard",
    path: "/",
    label: "Resumen",
    icon: "LayoutDashboard",
    group: "General",
  },
  {
    name: "Asociados",
    path: "/asociados",
    label: "Asociados",
    icon: "Users",
    group: "Servicio",
  },
  {
    name: "Suscripciones",
    path: "/suscripciones",
    label: "Suscripciones",
    icon: "CreditCard",
    group: "Servicio",
  },
  {
    name: "MenuSemanal",
    path: "/menu-semanal",
    label: "Menú semanal",
    icon: "Utensils",
    group: "Servicio",
  },
  {
    name: "Pedidos",
    path: "/pedidos",
    label: "Pedidos",
    icon: "ShoppingBag",
    group: "Servicio",
  },
  {
    name: "Entregas",
    path: "/entregas",
    label: "Entregas",
    icon: "PackageCheck",
    group: "Servicio",
  },
  {
    name: "LibroCaja",
    path: "/libro-caja",
    label: "Libro de caja",
    icon: "Wallet",
    group: "Organización",
  },
  {
    name: "Tareas",
    path: "/tareas",
    label: "Tareas",
    icon: "ListChecks",
    group: "Organización",
  },
  {
    name: "Actas",
    path: "/actas",
    label: "Actas",
    icon: "NotebookPen",
    group: "Organización",
  },
  {
    name: "Informe",
    path: "/informe",
    label: "Informe de seguimiento",
    icon: "ChartNoAxesCombined",
    group: "Análisis",
  },
  {
    name: "Proyecto",
    path: "/proyecto",
    label: "El proyecto",
    icon: "Sprout",
    group: "Análisis",
  },
  {
    name: "Datos",
    path: "/datos",
    label: "Datos y respaldo",
    icon: "Database",
    group: "Análisis",
  },
];
const all = MODULOS.map((m) => m.name);
export const PERMISOS_POR_ROL = Object.fromEntries(
  ROLES.map((r) => [
    r.id,
    r.id === "asociado" ? ["Dashboard", "MenuSemanal", "Proyecto"] : all,
  ]),
);
const escritura = {
  administracion: [
    "Asociados",
    "Suscripciones",
    "MenuSemanal",
    "Pedidos",
    "Entregas",
    "LibroCaja",
    "Tareas",
    "Actas",
    "Datos",
  ],
  tesorero: ["Suscripciones", "LibroCaja"],
  distribucion: ["Pedidos", "Entregas"],
  secretario: ["Asociados", "Tareas", "Actas"],
};
export const puedeAcceder = (rol, modulo) =>
  PERMISOS_POR_ROL[rol]?.includes(modulo) || false;
export const puedeEditar = (rol, modulo) =>
  escritura[rol]?.includes(modulo) || false;
export const nombreRol = (rol) =>
  ROLES.find((r) => r.id === rol)?.nombre || "Sin rol asignado";
