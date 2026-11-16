import { resumenDeDatos } from "@/utils/resumen";
import { supabase, supabaseConfigurado } from "./supabase";
import * as seed from "@/data/mockData";
import { modules } from "@/data/modules";
import { useAuthStore } from "@/stores/auth";
import { puedeEditar, puedeAcceder } from "@/utils/roles";
export const STORAGE_KEY = "viandita-data-v1";
const seedKeys = {
  usuarios: "USUARIOS_MOCK",
  asociados: "ASOCIADOS_MOCK",
  cargos: "CARGOS_MOCK",
  comisiones: "COMISIONES_MOCK",
  tipos_vianda: "TIPOS_VIANDA_MOCK",
  menu_semanal: "MENU_SEMANAL_MOCK",
  suscripciones: "SUSCRIPCIONES_MOCK",
  pedidos: "PEDIDOS_MOCK",
  libro_caja: "LIBRO_CAJA_MOCK",
  entregas: "ENTREGAS_MOCK",
  tareas: "TAREAS_MOCK",
  actas: "ACTAS_MOCK",
};
const modulo = {
  asociados: "Asociados",
  suscripciones: "Suscripciones",
  pedidos: "Pedidos",
  menu_semanal: "MenuSemanal",
  libro_caja: "LibroCaja",
  entregas: "Entregas",
  tareas: "Tareas",
  actas: "Actas",
};
const initial = () =>
  Object.fromEntries(
    Object.entries(seedKeys).map(([k, v]) => [k, structuredClone(seed[v])]),
  );
const normalize = (data) => ({
  ...data,
  pedidos: data.pedidos.map((row) => ({
    ...row,
    estado: row.estado || "pendiente",
  })),
});
let dbMock = normalize(initial());
export let storageError = "";
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    validateBackup(parsed);
    dbMock = normalize(parsed.data);
  }
} catch {
  storageError =
    "No se pudieron leer los datos locales. Exportá una copia de recuperación antes de restablecerlos en Datos y respaldo.";
}
export function validateBackup(value) {
  if (
    value?.version !== 1 ||
    !value.data ||
    Object.keys(seedKeys).some((k) => !Array.isArray(value.data[k]))
  )
    throw Error("El respaldo no tiene el formato de La Viandita (versión 1).");
  for (const [key, rows] of Object.entries(value.data)) {
    if (!seedKeys[key]) throw Error("Tabla desconocida en el respaldo.");
    const ids = new Set();
    for (const row of rows) {
      if (!row || typeof row.id !== "string" || !row.id || ids.has(row.id))
        throw Error("Identificadores inválidos o duplicados.");
      ids.add(row.id);
    }
  }
  for (const config of Object.values(modules))
    for (const row of value.data[config.table])
      for (const field of config.fields) {
        const v = row[field.key];
        if (
          field.required &&
          (v === null || v === undefined || String(v).trim() === "")
        )
          throw Error("El respaldo tiene campos obligatorios incompletos.");
        if (v === null || v === undefined || v === "") continue;
        if (field.type === "boolean" && typeof v !== "boolean")
          throw Error("El respaldo contiene estados inválidos.");
        if (
          field.type === "number" &&
          (!Number.isFinite(Number(v)) ||
            Number(v) < (field.min ?? 0) ||
            (field.max && Number(v) > field.max) ||
            (field.step === 1 && !Number.isInteger(Number(v))))
        )
          throw Error("El respaldo contiene cantidades inválidas.");
        if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(String(v)))
          throw Error("El respaldo contiene fechas inválidas.");
        if (field.options && !field.options.some((o) => o.value === v))
          throw Error("El respaldo contiene opciones inválidas.");
        if (
          !["boolean", "number"].includes(field.type) &&
          typeof v !== "string"
        )
          throw Error("El respaldo contiene textos inválidos.");
      }
  const links = {
    suscripciones: { asociado_id: "asociados" },
    pedidos: { suscripcion_id: "suscripciones", menu_id: "menu_semanal" },
    entregas: { pedido_id: "pedidos" },
    menu_semanal: { tipo_vianda_id: "tipos_vianda" },
    tareas: { comision_id: "comisiones" },
  };
  for (const [tab, fields] of Object.entries(links))
    for (const row of value.data[tab])
      for (const [key, target] of Object.entries(fields))
        if (!value.data[target].some((r) => r.id === row[key]))
          throw Error("El respaldo contiene referencias incompletas.");
  return true;
}
function permiso(tabla, write = false) {
  const auth = useAuthStore();
  if (!auth.isAuthenticated) throw Error("Iniciá sesión para continuar.");
  if (write && !puedeEditar(auth.role, modulo[tabla]))
    throw Error("Tu rol no puede modificar este registro.");
  if (
    !write &&
    auth.role === "asociado" &&
    !["menu_semanal", "tipos_vianda", "comisiones", "cargos"].includes(tabla)
  )
    throw Error("Tu rol solo puede consultar información general.");
  if (!seedKeys[tabla]) throw Error("Registro no válido.");
}
function commit(next) {
  if (storageError) throw Error(storageError);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, data: next }),
    );
    dbMock = next;
    window.dispatchEvent(new Event("viandita-data"));
  } catch (e) {
    throw Error(
      "No se pudo guardar. Revisá el espacio o los permisos del navegador. No se aplicó el cambio.",
    );
  }
}
export async function obtenerTodos(tabla, filtros = {}) {
  permiso(tabla);
  if (!supabaseConfigurado()) {
    if (storageError) throw Error(storageError);
    return {
      data: structuredClone(
        dbMock[tabla].filter((r) =>
          Object.entries(filtros).every(([k, v]) => r[k] === v),
        ),
      ),
      error: null,
    };
  }
  let query = supabase
    .from(tabla)
    .select("*")
    .order("creado_en", { ascending: false });
  for (const [k, v] of Object.entries(filtros)) query = query.eq(k, v);
  return await query;
}
export async function insertar(tabla, registro) {
  permiso(tabla, true);
  if (supabaseConfigurado())
    return await supabase.from(tabla).insert(registro).select().single();
  const next = structuredClone(dbMock);
  const nuevo = {
    ...registro,
    id: crypto.randomUUID(),
    creado_en: new Date().toISOString(),
  };
  next[tabla].unshift(nuevo);
  commit(next);
  return { data: nuevo, error: null };
}
export async function actualizar(tabla, id, cambios) {
  permiso(tabla, true);
  if (supabaseConfigurado())
    return await supabase
      .from(tabla)
      .update(cambios)
      .eq("id", id)
      .select()
      .single();
  const next = structuredClone(dbMock);
  const idx = next[tabla].findIndex((r) => r.id === id);
  if (idx < 0) throw Error("No se encontró el registro.");
  next[tabla][idx] = { ...next[tabla][idx], ...cambios, id };
  commit(next);
  return { data: next[tabla][idx], error: null };
}
export function exportarDatos() {
  if (!puedeAcceder(useAuthStore().role, "Datos")) throw Error("Sin permiso.");
  return storageError
    ? localStorage.getItem(STORAGE_KEY)
    : JSON.stringify(
        { version: 1, exportado: new Date().toISOString(), data: dbMock },
        null,
        2,
      );
}
export function importarDatos(value) {
  if (supabaseConfigurado() || !puedeEditar(useAuthStore().role, "Datos"))
    throw Error("Solo Administración puede restaurar datos locales.");
  validateBackup(value);
  const previous = storageError;
  storageError = "";
  try {
    commit(normalize(value.data));
  } catch (e) {
    storageError = previous;
    throw e;
  }
}
export function restablecerDatos() {
  importarDatos({ version: 1, data: initial() });
}
export async function obtenerResumen(desde, hasta) {
  if (!useAuthStore().isAuthenticated) throw Error("Iniciá sesión.");
  if (!supabaseConfigurado()) {
    if (storageError) throw Error(storageError);
    return resumenDeDatos(dbMock, desde, hasta);
  }
  const { data, error } = await supabase.rpc("resumen_periodo", {
    desde,
    hasta,
  });
  if (error) {
    if (error.code === "PGRST202")
      throw Error(
        "Falta actualizar la base de datos: el responsable debe ejecutar sql/upgrade_gestion.sql en Supabase.",
      );
    throw error;
  }
  return data;
}
export async function datosDeGestion() {
  const tablas = Object.keys(seedKeys);
  const rows = await Promise.all(tablas.map((t) => obtenerTodos(t)));
  const result = {};
  rows.forEach((res, i) => {
    if (res.error) throw res.error;
    result[tablas[i]] = res.data || [];
  });
  return result;
}
