import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularMargenMensual,
  calcularEntregasHorario,
  calcularCumplimientoTareas,
} from "../src/utils/kpi.js";
import { resumenDeDatos } from "../src/utils/resumen.js";
import * as seed from "../src/data/mockData.js";
test("las metas se cumplen exactamente en el umbral y no por redondeo anticipado", () => {
  assert.equal(calcularEntregasHorario(19, 20).cumpleMeta, true);
  assert.equal(calcularEntregasHorario(94999, 100000).cumpleMeta, false);
  assert.equal(calcularCumplimientoTareas(17, 20).cumpleMeta, true);
  assert.equal(calcularMargenMensual(100, 80).etiqueta, "En meta");
  assert.equal(calcularMargenMensual(100, 79).etiqueta, "Revisar precio");
});
test("ausencia de ingresos o denominador no se muestra como cero", () => {
  assert.equal(calcularMargenMensual(0, 10).valor, null);
  assert.equal(calcularEntregasHorario(0, 0).valor, null);
  assert.equal(calcularCumplimientoTareas(0, 0).valor, null);
});
const data = {
  libro_caja: seed.LIBRO_CAJA_MOCK,
  entregas: seed.ENTREGAS_MOCK,
  tareas: seed.TAREAS_MOCK,
  suscripciones: seed.SUSCRIPCIONES_MOCK,
  pedidos: seed.PEDIDOS_MOCK,
};
test("el período y la vigencia recortan todas las métricas", () => {
  const marzo = resumenDeDatos(data, "2026-03-01", "2026-03-31");
  assert.deepEqual(marzo, {
    ingresos: 84000,
    egresos: 38000,
    vigentes: 4,
    entregas: 9,
    enHorario: 7,
    tareas: 7,
    cumplidas: 4,
    pedidos: 10,
  });
  const nov = resumenDeDatos(data, "2026-11-01", "2026-11-30");
  assert.deepEqual(nov, {
    ingresos: 0,
    egresos: 0,
    vigentes: 0,
    entregas: 0,
    enHorario: 0,
    tareas: 0,
    cumplidas: 0,
    pedidos: 0,
  });
});
test("suscriptores distintos y cierre efectivo a tiempo, no simples filas o flags", () => {
  const copia = structuredClone(data);
  copia.suscripciones.push({ ...copia.suscripciones[1], id: "otra" });
  copia.tareas[0].fecha_cumplimiento = "2026-03-20";
  assert.equal(resumenDeDatos(copia, "2026-03-01", "2026-03-31").vigentes, 4);
  assert.equal(resumenDeDatos(copia, "2026-03-01", "2026-03-31").cumplidas, 3);
});

test("los pedidos cancelados conservan su historia y no suman viandas", () => {
  const copia = structuredClone(data);
  copia.pedidos[0].estado = "cancelado";
  assert.equal(resumenDeDatos(copia, "2026-03-01", "2026-03-31").pedidos, 9);
  assert.equal(copia.pedidos.length, 9);
});
