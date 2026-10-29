/**
 * Definición de roles y permisos del sistema.
 * Se usa tanto en la interfaz (para mostrar/ocultar opciones) como referencia
 * para las políticas de acceso (RLS) de Supabase.
 */

export const ROLES = [
  { id: 'tesorero', nombre: 'Tesorero', descripcion: 'Gestiona el Libro de Caja y el margen mensual' },
  { id: 'administracion', nombre: 'Administración', descripcion: 'Gestiona asociados, suscripciones y cobros' },
  { id: 'distribucion', nombre: 'Distribución', descripcion: 'Gestiona entregas y listas de retiro' },
  { id: 'secretario', nombre: 'Secretario', descripcion: 'Gestiona actas y tareas asignadas' },
  { id: 'asociado', nombre: 'Asociado', descripcion: 'Estudiante asociado de la precooperativa' },
  { id: 'docente_asesor', nombre: 'Docente Asesor', descripcion: 'Acompaña y supervisa la precooperativa' },
  { id: 'director', nombre: 'Director', descripcion: 'Autoridad de la escuela, supervisa la precooperativa' },
]

/**
 * Módulos a los que puede acceder cada rol.
 */
export const PERMISOS_POR_ROL = {
  tesorero: ['Dashboard', 'LibroCaja', 'Suscripciones'],
  administracion: ['Dashboard', 'Asociados', 'Suscripciones', 'Pedidos'],
  distribucion: ['Dashboard', 'Pedidos', 'Entregas'],
  secretario: ['Dashboard', 'Tareas', 'Actas'],
  asociado: ['Dashboard'],
  docente_asesor: ['Dashboard', 'Asociados', 'Actas'],
  director: ['Dashboard', 'Asociados', 'Actas'],
}

/**
 * Verifica si un rol puede acceder a un módulo.
 */
export function puedeAcceder(rol, modulo) {
  if (!rol) return false
  const modulos = PERMISOS_POR_ROL[rol] || []
  return modulos.includes(modulo)
}
