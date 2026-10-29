/**
 * Validadores de formularios.
 * Se usan para validar campos obligatorios, formatos y valores permitidos.
 */

/**
 * Valida que un campo obligatorio no esté vacío.
 * Retorna null si es válido, o un mensaje de error si no.
 */
export function requerido(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 'Este campo es obligatorio.'
  }
  return null
}

/**
 * Valida un email con formato sencillo.
 */
export function email(valor) {
  if (!valor) return null // se maneja con requerido por separado
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(valor)) {
    return 'Ingresá un correo electrónico válido.'
  }
  return null
}

/**
 * Valida un teléfono (solo números, espacios, guiones y paréntesis, entre 7 y 20 chars).
 */
export function telefono(valor) {
  if (!valor) return null
  const regex = /^[\d\s\-()]{7,20}$/
  if (!regex.test(valor)) {
    return 'Ingresá un teléfono válido.'
  }
  return null
}

/**
 * Valida que sea un número positivo (mayor o igual a 0).
 */
export function numeroPositivo(valor) {
  if (valor === '' || valor === null) return null // se maneja con requerido por separado
  const n = Number(valor)
  if (isNaN(n) || n < 0) {
    return 'Ingresá un número válido (mayor o igual a 0).'
  }
  return null
}

/**
 * Valida que sea un número entero positivo.
 */
export function enteroPositivo(valor) {
  if (valor === '' || valor === null) return null
  const n = Number(valor)
  if (!Number.isInteger(n) || n < 1) {
    return 'Ingresá un número entero mayor a 0.'
  }
  return null
}

/**
 * Valida que el curso esté entre 1 y 7.
 */
export function cursoValido(valor) {
  if (valor === '' || valor === null) return null
  const n = Number(valor)
  if (!Number.isInteger(n) || n < 1 || n > 7) {
    return 'El curso debe estar entre 1 y 7.'
  }
  return null
}

/**
 * Valida que la división sea 1, 2 o 3.
 */
export function divisionValida(valor) {
  if (!valor) return 'La división es obligatoria.'
  if (!['1', '2', '3'].includes(String(valor))) {
    return 'La división debe ser 1, 2 o 3.'
  }
  return null
}

/**
 * Valida que la fecha no sea futura (para fechas de alta, inicio, etc.).
 */
export function fechaNoFutura(valor) {
  if (!valor) return null
  const hoy = new Date().toISOString().split('T')[0]
  if (valor > hoy) {
    return 'La fecha no puede ser futura.'
  }
  return null
}

/**
 * Valida que fechaFin sea mayor o igual a fechaInicio.
 */
export function fechaFinValida(fechaFin, fechaInicio) {
  if (!fechaFin || !fechaInicio) return null
  if (fechaFin < fechaInicio) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio.'
  }
  return null
}

/**
 * Ejecuta varios validadores sobre un valor y devuelve el primer error encontrado.
 */
export function validarCampo(valor, validadores) {
  for (const v of validadores) {
    const error = v(valor)
    if (error) return error
  }
  return null
}
