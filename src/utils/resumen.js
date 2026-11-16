export function resumenDeDatos(data, desde, hasta) {
  const entre = (d) => d && d >= desde && d <= hasta;
  const caja = data.libro_caja.filter((r) => entre(r.fecha)),
    entregas = data.entregas.filter((r) => entre(r.fecha)),
    tareas = data.tareas.filter((r) => entre(r.fecha_limite));
  const ingresos = caja
      .filter((r) => r.tipo === "ingreso")
      .reduce((s, r) => s + Number(r.monto), 0),
    egresos = caja
      .filter((r) => r.tipo === "egreso")
      .reduce((s, r) => s + Number(r.monto), 0);
  const vigentes = new Set(
    data.suscripciones
      .filter(
        (r) =>
          r.estado === "activa" &&
          r.fecha_inicio <= hasta &&
          (!r.fecha_fin || r.fecha_fin >= hasta),
      )
      .map((r) => r.asociado_id),
  ).size;
  const cumplidas = tareas.filter(
    (r) =>
      r.cumplida &&
      r.fecha_cumplimiento &&
      r.fecha_cumplimiento <= r.fecha_limite &&
      r.fecha_cumplimiento <= hasta,
  ).length;
  return {
    ingresos,
    egresos,
    vigentes,
    entregas: entregas.length,
    enHorario: entregas.filter((r) => r.dentro_franja).length,
    tareas: tareas.length,
    cumplidas,
    pedidos: data.pedidos
      .filter((r) => entre(r.fecha) && r.estado !== "cancelado")
      .reduce((s, r) => s + Number(r.cantidad), 0),
  };
}
