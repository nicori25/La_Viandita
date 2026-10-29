/**
 * Utilidades para calcular los KPIs del tablero.
 * Las fórmulas siguen la consigna del trabajo integrador.
 */

/**
 * Calcula el margen mensual.
 * Fórmula: (ingresos - egresos) / ingresos * 100
 * Retorna un objeto con: valor (numero o null), estado ('verde'|'amarillo'|'rojo'), etiqueta
 */
export function calcularMargenMensual(ingresos, egresos) {
  if (!ingresos || ingresos <= 0) {
    return {
      valor: null,
      estado: 'rojo',
      etiqueta: 'no calculable',
      color: 'badge-rojo',
      cumpleMeta: false,
    }
  }

  const margen = ((ingresos - egresos) / ingresos) * 100

  let estado, etiqueta, cumpleMeta

  if (margen >= 20) {
    // Supera el 20%: revisar precio (pero técnicamente está "en meta" o más)
    estado = 'amarillo'
    etiqueta = 'Revisar precio'
    cumpleMeta = true
  } else if (margen >= 10) {
    estado = 'verde'
    etiqueta = 'En meta'
    cumpleMeta = true
  } else if (margen >= 9) {
    // 90% de la meta (10%) = 9%
    estado = 'amarillo'
    etiqueta = 'En alerta'
    cumpleMeta = false
  } else {
    estado = 'rojo'
    etiqueta = 'Crítico'
    cumpleMeta = false
  }

  return {
    valor: Math.round(margen * 100) / 100,
    estado,
    etiqueta,
    color: `badge-${estado}`,
    cumpleMeta,
  }
}

/**
 * Calcula suscriptos activos (pago vigente).
 * Meta: 40 en la semana 8.
 */
export function calcularSuscriptosActivos(activos, meta = 40) {
  const porcentaje = (activos / meta) * 100

  let estado, etiqueta, cumpleMeta

  if (porcentaje >= 100) {
    estado = 'verde'
    etiqueta = 'En meta'
    cumpleMeta = true
  } else if (porcentaje >= 90) {
    estado = 'amarillo'
    etiqueta = 'En alerta'
    cumpleMeta = false
  } else {
    estado = 'rojo'
    etiqueta = 'Crítico'
    cumpleMeta = false
  }

  return {
    valor: activos,
    meta,
    porcentaje: Math.round(porcentaje * 100) / 100,
    estado,
    etiqueta,
    color: `badge-${estado}`,
    cumpleMeta,
  }
}

/**
 * Calcula entregas en horario (%).
 * Fórmula: entregas dentro de la franja / entregas totales * 100
 * Meta: 95% o más.
 */
export function calcularEntregasHorario(dentroFranja, totales) {
  if (!totales || totales <= 0) {
    return {
      valor: null,
      estado: 'rojo',
      etiqueta: 'no calculable',
      color: 'badge-rojo',
      cumpleMeta: false,
    }
  }

  const porcentaje = (dentroFranja / totales) * 100

  let estado, etiqueta, cumpleMeta

  if (porcentaje >= 100) {
    estado = 'verde'
    etiqueta = 'En meta'
    cumpleMeta = true
  } else if (porcentaje >= 90) {
    estado = 'amarillo'
    etiqueta = 'En alerta'
    cumpleMeta = false
  } else {
    estado = 'rojo'
    etiqueta = 'Crítico'
    cumpleMeta = false
  }

  return {
    valor: Math.round(porcentaje * 100) / 100,
    dentroFranja,
    totales,
    estado,
    etiqueta,
    color: `badge-${estado}`,
    cumpleMeta,
  }
}

/**
 * Calcula cumplimiento de tareas asignadas (%).
 * Fórmula: tareas cumplidas en plazo / tareas asignadas * 100
 * Meta: 85% o más.
 */
export function calcularCumplimientoTareas(cumplidas, asignadas) {
  if (!asignadas || asignadas <= 0) {
    return {
      valor: null,
      estado: 'rojo',
      etiqueta: 'no calculable',
      color: 'badge-rojo',
      cumpleMeta: false,
    }
  }

  const porcentaje = (cumplidas / asignadas) * 100

  let estado, etiqueta, cumpleMeta

  if (porcentaje >= 100) {
    estado = 'verde'
    etiqueta = 'En meta'
    cumpleMeta = true
  } else if (porcentaje >= 90) {
    estado = 'amarillo'
    etiqueta = 'En alerta'
    cumpleMeta = false
  } else {
    estado = 'rojo'
    etiqueta = 'Crítico'
    cumpleMeta = false
  }

  return {
    valor: Math.round(porcentaje * 100) / 100,
    cumplidas,
    asignadas,
    estado,
    etiqueta,
    color: `badge-${estado}`,
    cumpleMeta,
  }
}

/**
 * Devuelve el texto del estado para mostrar en el tablero.
 */
export function getEstadoInfo(estado) {
  const map = {
    verde: { etiqueta: 'En meta', color: 'badge-verde', cumpleMeta: true },
    amarillo: { etiqueta: 'En alerta', color: 'badge-amarillo', cumpleMeta: false },
    rojo: { etiqueta: 'Crítico', color: 'badge-rojo', cumpleMeta: false },
  }
  return map[estado] || map.rojo
}
