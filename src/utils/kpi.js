const estado = (valor, meta) =>
  valor === null
    ? { estado: "neutral", etiqueta: "No calculable", cumpleMeta: false }
    : valor >= meta
      ? { estado: "verde", etiqueta: "En meta", cumpleMeta: true }
      : valor >= meta * 0.9
        ? { estado: "amarillo", etiqueta: "En alerta", cumpleMeta: false }
        : { estado: "rojo", etiqueta: "Crítico", cumpleMeta: false };
const redondear = (n) => Math.round(n * 100) / 100;
export function calcularMargenMensual(ingresos, egresos) {
  const raw = ingresos > 0 ? ((ingresos - egresos) / ingresos) * 100 : null;
  const valor = raw === null ? null : redondear(raw);
  return {
    valor,
    ...estado(raw, 10),
    ...(raw > 20
      ? { estado: "amarillo", etiqueta: "Revisar precio", cumpleMeta: true }
      : {}),
  };
}
export function calcularSuscriptosActivos(activos, meta = 40) {
  return {
    valor: activos,
    meta,
    porcentaje: redondear((activos / meta) * 100),
    ...estado(activos, meta),
  };
}
export function calcularEntregasHorario(dentroFranja, totales) {
  const raw = totales > 0 ? (dentroFranja / totales) * 100 : null;
  return {
    valor: raw === null ? null : redondear(raw),
    dentroFranja,
    totales,
    ...estado(raw, 95),
  };
}
export function calcularCumplimientoTareas(cumplidas, asignadas) {
  const raw = asignadas > 0 ? (cumplidas / asignadas) * 100 : null;
  return {
    valor: raw === null ? null : redondear(raw),
    cumplidas,
    asignadas,
    ...estado(raw, 85),
  };
}
