/**
 * Servicios de acceso a datos con Supabase.
 *
 * Diseño para el paso 14: conectar Vue.js con Supabase.
 *
 * Cómo funciona:
 * - Si VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están configurados en .env,
 *   se usa Supabase (base de datos real en la nube).
 * - Si no están configurados, se usa MODO PRUEBA con datos ficticios
 *   (importados de src/data/mockData.js).
 *
 * Esto permite probar la app sin Supabase y activarlo después solo
 * completando el archivo .env.
 */

import { supabase, supabaseConfigurado } from './supabase'
import {
  ASOCIADOS_MOCK,
  SUSCRIPCIONES_MOCK,
  PEDIDOS_MOCK,
  MENU_SEMANAL_MOCK,
  TIPOS_VIANDA_MOCK,
  COMISIONES_MOCK,
  CARGOS_MOCK,
  LIBRO_CAJA_MOCK,
  ENTREGAS_MOCK,
  TAREAS_MOCK,
  ACTAS_MOCK,
  USUARIOS_MOCK,
} from '@/data/mockData'

// ---------------------------------------------------------------------------
// Estado de datos de prueba (se usa solo cuando Supabase no está configurado)
// ---------------------------------------------------------------------------
let dbMock = {
  usuarios: [...USUARIOS_MOCK],
  asociados: [...ASOCIADOS_MOCK],
  cargos: [...CARGOS_MOCK],
  comisiones: [...COMISIONES_MOCK],
  tipos_vianda: [...TIPOS_VIANDA_MOCK],
  menu_semanal: [...MENU_SEMANAL_MOCK],
  suscripciones: [...SUSCRIPCIONES_MOCK],
  pedidos: [...PEDIDOS_MOCK],
  libro_caja: [...LIBRO_CAJA_MOCK],
  entregas: [...ENTREGAS_MOCK],
  tareas: [...TAREAS_MOCK],
  actas: [...ACTAS_MOCK],
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

/**
 * Convierte un registro de Supabase al formato usado por la app.
 * Supabase devuelve { id, ...campos } directamente.
 */
function normalizar(dato) {
  if (!dato) return null
  return dato
}

/**
 * Genera un ID temporal para datos de prueba.
 */
function generarIdMock(tabla) {
  return `${tabla.slice(0, 2)}${Date.now()}`
}

// ---------------------------------------------------------------------------
// Servicios genéricos CRUD
// ---------------------------------------------------------------------------

/**
 * Obtiene todos los registros de una tabla.
 * @param {string} tabla - Nombre de la tabla en Supabase
 * @param {Object} filtros - Filtros opcionales { columna: valor }
 */
export async function obtenerTodos(tabla, filtros = {}) {
  if (!supabaseConfigurado()) {
    let datos = [...dbMock[tabla] || []]
    for (const [col, val] of Object.entries(filtros)) {
      datos = datos.filter((d) => d[col] === val)
    }
    return { data: datos, error: null }
  }

  let consulta = supabase.from(tabla).select('*')
  for (const [col, val] of Object.entries(filtros)) {
    consulta = consulta.eq(col, val)
  }
  const { data, error } = await consulta.order('creado_en', { ascending: false })
  return { data: data || [], error }
}

/**
 * Obtiene un registro por su ID.
 */
export async function obtenerPorId(tabla, id) {
  if (!supabaseConfigurado()) {
    const dato = (dbMock[tabla] || []).find((d) => d.id === id)
    return { data: dato || null, error: null }
  }
  const { data, error } = await supabase.from(tabla).select('*').eq('id', id).single()
  return { data, error }
}

/**
 * Inserta un nuevo registro.
 */
export async function insertar(tabla, registro) {
  if (!supabaseConfigurado()) {
    const nuevo = { id: generarIdMock(tabla), creado_en: new Date().toISOString(), ...registro }
    dbMock[tabla].push(nuevo)
    return { data: nuevo, error: null }
  }
  const { data, error } = await supabase.from(tabla).insert(registro).select().single()
  return { data, error }
}

/**
 * Actualiza un registro existente por ID.
 */
export async function actualizar(tabla, id, cambios) {
  if (!supabaseConfigurado()) {
    const idx = dbMock[tabla].findIndex((d) => d.id === id)
    if (idx === -1) return { data: null, error: { message: 'No encontrado' } }
    dbMock[tabla][idx] = { ...dbMock[tabla][idx], ...cambios }
    return { data: dbMock[tabla][idx], error: null }
  }
  const { data, error } = await supabase.from(tabla).update(cambios).eq('id', id).select().single()
  return { data, error }
}

/**
 * Elimina un registro por ID (eliminación física).
 * Para datos de prueba, lo elimina del array mock.
 */
export async function eliminar(tabla, id) {
  if (!supabaseConfigurado()) {
    const idx = dbMock[tabla].findIndex((d) => d.id === id)
    if (idx === -1) return { error: { message: 'No encontrado' } }
    dbMock[tabla].splice(idx, 1)
    return { data: { id }, error: null }
  }
  const { error } = await supabase.from(tabla).delete().eq('id', id)
  return { data: { id }, error }
}

/**
 * Desactiva un registro (baja lógica): establece activo = false o estado = 'baja'.
 * Se prefiere esto sobre eliminar para conservar el historial.
 */
export async function desactivar(tabla, id) {
  // Intentar campo 'activo' primero, si no existe usar 'estado'
  const registro = await obtenerPorId(tabla, id)
  if (registro.error || !registro.data) return registro

  const dato = registro.data
  if (dato.activo !== undefined) {
    return actualizar(tabla, id, { activo: false })
  } else if (dato.estado !== undefined) {
    return actualizar(tabla, id, { estado: 'baja' })
  }
  return { data: dato, error: null }
}

/**
 * Reactiva un registro dado de baja.
 */
export async function reactivar(tabla, id) {
  const registro = await obtenerPorId(tabla, id)
  if (registro.error || !registro.data) return registro

  const dato = registro.data
  if (dato.activo !== undefined) {
    return actualizar(tabla, id, { activo: true })
  } else if (dato.estado !== undefined) {
    return actualizar(tabla, id, { estado: 'activa' })
  }
  return { data: dato, error: null }
}

// ---------------------------------------------------------------------------
// Servicios específicos por entidad (con nombres claros para la app)
// ---------------------------------------------------------------------------

export const asociadosService = {
  listar: (filtros) => obtenerTodos('asociados', filtros),
  obtener: (id) => obtenerPorId('asociados', id),
  crear: (registro) => insertar('asociados', registro),
  actualizar: (id, cambios) => actualizar('asociados', id, cambios),
  eliminar: (id) => eliminar('asociados', id),
  darDeBaja: (id) => desactivar('asociados', id),
  reactivar: (id) => reactivar('asociados', id),
}

export const suscripcionesService = {
  listar: (filtros) => obtenerTodos('suscripciones', filtros),
  obtener: (id) => obtenerPorId('suscripciones', id),
  crear: (registro) => insertar('suscripciones', registro),
  actualizar: (id, cambios) => actualizar('suscripciones', id, cambios),
  eliminar: (id) => eliminar('suscripciones', id),
  darDeBaja: (id) => desactivar('suscripciones', id),
  reactivar: (id) => reactivar('suscripciones', id),
}

export const pedidosService = {
  listar: (filtros) => obtenerTodos('pedidos', filtros),
  obtener: (id) => obtenerPorId('pedidos', id),
  crear: (registro) => insertar('pedidos', registro),
  actualizar: (id, cambios) => actualizar('pedidos', id, cambios),
  eliminar: (id) => eliminar('pedidos', id),
}

export const menuSemanalService = {
  listar: (filtros) => obtenerTodos('menu_semanal', filtros),
  obtener: (id) => obtenerPorId('menu_semanal', id),
  crear: (registro) => insertar('menu_semanal', registro),
  actualizar: (id, cambios) => actualizar('menu_semanal', id, cambios),
  eliminar: (id) => eliminar('menu_semanal', id),
}

export const libroCajaService = {
  listar: (filtros) => obtenerTodos('libro_caja', filtros),
  obtener: (id) => obtenerPorId('libro_caja', id),
  crear: (registro) => insertar('libro_caja', registro),
  actualizar: (id, cambios) => actualizar('libro_caja', id, cambios),
  eliminar: (id) => eliminar('libro_caja', id),
}

export const entregasService = {
  listar: (filtros) => obtenerTodos('entregas', filtros),
  obtener: (id) => obtenerPorId('entregas', id),
  crear: (registro) => insertar('entregas', registro),
  actualizar: (id, cambios) => actualizar('entregas', id, cambios),
  eliminar: (id) => eliminar('entregas', id),
}

export const tareasService = {
  listar: (filtros) => obtenerTodos('tareas', filtros),
  obtener: (id) => obtenerPorId('tareas', id),
  crear: (registro) => insertar('tareas', registro),
  actualizar: (id, cambios) => actualizar('tareas', id, cambios),
  eliminar: (id) => eliminar('tareas', id),
}

export const actasService = {
  listar: (filtros) => obtenerTodos('actas', filtros),
  obtener: (id) => obtenerPorId('actas', id),
  crear: (registro) => insertar('actas', registro),
  actualizar: (id, cambios) => actualizar('actas', id, cambios),
  eliminar: (id) => eliminar('actas', id),
}

export const usuariosService = {
  listar: (filtros) => obtenerTodos('usuarios', filtros),
  obtener: (id) => obtenerPorId('usuarios', id),
  crear: (registro) => insertar('usuarios', registro),
  actualizar: (id, cambios) => actualizar('usuarios', id, cambios),
  eliminar: (id) => eliminar('usuarios', id),
}

export const tiposViandaService = {
  listar: (filtros) => obtenerTodos('tipos_vianda', filtros),
  obtener: (id) => obtenerPorId('tipos_vianda', id),
  crear: (registro) => insertar('tipos_vianda', registro),
  actualizar: (id, cambios) => actualizar('tipos_vianda', id, cambios),
  eliminar: (id) => eliminar('tipos_vianda', id),
}

export const comisionesService = {
  listar: (filtros) => obtenerTodos('comisiones', filtros),
  obtener: (id) => obtenerPorId('comisiones', id),
  crear: (registro) => insertar('comisiones', registro),
  actualizar: (id, cambios) => actualizar('comisiones', id, cambios),
  eliminar: (id) => eliminar('comisiones', id),
}

export const cargosService = {
  listar: (filtros) => obtenerTodos('cargos', filtros),
  obtener: (id) => obtenerPorId('cargos', id),
  crear: (registro) => insertar('cargos', registro),
  actualizar: (id, cambios) => actualizar('cargos', id, cambios),
  eliminar: (id) => eliminar('cargos', id),
}

// ---------------------------------------------------------------------------
// Estadísticas para el tablero (KPI)
// ---------------------------------------------------------------------------

/**
 * Obtiene los movimientos del libro de caja para calcular margen mensual.
 * Retorna { ingresos, egresos }.
 */
export async function obtenerResumenCaja() {
  if (!supabaseConfigurado()) {
    const ingresos = dbMock.libro_caja
      .filter((m) => m.tipo === 'ingreso')
      .reduce((s, m) => s + Number(m.monto), 0)
    const egresos = dbMock.libro_caja
      .filter((m) => m.tipo === 'egreso')
      .reduce((s, m) => s + Number(m.monto), 0)
    return { ingresos, egresos }
  }
  const { data, error } = await supabase
    .from('libro_caja')
    .select('tipo, monto')
  if (error) return { ingresos: 0, egresos: 0, error }
  const ingresos = data.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0)
  const egresos = data.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0)
  return { ingresos, egresos, error: null }
}

/**
 * Cuenta suscripciones activas.
 */
export async function contarSuscripcionesActivas() {
  if (!supabaseConfigurado()) {
    const count = dbMock.suscripciones.filter((s) => s.estado === 'activa').length
    return { count }
  }
  const { count, error } = await supabase
    .from('suscripciones')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'activa')
  return { count: count || 0, error }
}

/**
 * Estadísticas de entregas para el KPI de entregas en horario.
 */
export async function obtenerEstadisticasEntregas() {
  if (!supabaseConfigurado()) {
    const totales = dbMock.entregas.length
    const dentro = dbMock.entregas.filter((e) => e.dentro_franja).length
    return { totales, dentroFranja: dentro }
  }
  const { data, error } = await supabase.from('entregas').select('dentro_franja')
  if (error) return { totales: 0, dentroFranja: 0, error }
  const totales = data.length
  const dentroFranja = data.filter((e) => e.dentro_franja).length
  return { totales, dentroFranja, error: null }
}

/**
 * Estadísticas de tareas para el KPI de cumplimiento.
 */
export async function obtenerEstadisticasTareas() {
  if (!supabaseConfigurado()) {
    const asignadas = dbMock.tareas.length
    const cumplidas = dbMock.tareas.filter((t) => t.cumplida).length
    return { asignadas, cumplidas }
  }
  const { data, error } = await supabase.from('tareas').select('cumplida')
  if (error) return { asignadas: 0, cumplidas: 0, error }
  const asignadas = data.length
  const cumplidas = data.filter((t) => t.cumplida).length
  return { asignadas, cumplidas, error: null }
}

export { dbMock }
