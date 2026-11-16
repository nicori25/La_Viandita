import { test, expect } from "@playwright/test";
async function login(page, role = "Administración") {
  await page.goto("/");
  await page.getByRole("radio", { name: role, exact: true }).check();
  await page.getByRole("button", { name: "Ingresar al sistema" }).click();
  await expect(
    page.getByRole("heading", { name: "Así va nuestra cooperativa" }),
  ).toBeVisible();
  await expect(page.locator(".metric-card")).toHaveCount(4);
}
async function go(page, name) {
  await page.locator("aside").getByRole("link", { name, exact: true }).click();
  await expect(
    page.locator(".empty-state").filter({ hasText: "Cargando registros" }),
  ).toHaveCount(0);
}
test("navegación, alta válida, edición, baja por clic y persistencia", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  for (const name of [
    "Suscripciones",
    "Menú semanal",
    "Pedidos",
    "Entregas",
    "Libro de caja",
    "Tareas",
    "Actas",
  ]) {
    await go(page, name);
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".alert-error")).toHaveCount(0);
  }
  await go(page, "Asociados");
  await page
    .getByRole("button", { name: "Nuevo asociado", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("alert")).toContainText("Completá nombre");
  await page.getByLabel("Nombre", { exact: false }).fill("Alumno de prueba");
  await page.getByLabel("Apellido", { exact: false }).fill("Circuito");
  await page.getByLabel("Teléfono").fill("123456789");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("searchbox").fill("Circuito");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Nombre", { exact: false }).fill("Alumno editado");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await page.getByRole("button", { name: "Dar de baja", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reactivar" })).toBeVisible();
  await page.getByRole("button", { name: "Reactivar" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Dar de baja", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Asociados", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("Circuito");
  await expect(page.locator("tbody")).toContainText("Alumno editado");
  expect(errors).toEqual([]);
});
test("circuito de suscripción, pago, pedido y entrega con duplicados rechazados", async ({
  page,
}) => {
  await login(page);
  await go(page, "Asociados");
  await page
    .getByRole("button", { name: "Nuevo asociado", exact: true })
    .first()
    .click();
  await page.getByLabel("Nombre", { exact: false }).fill("Recorrido");
  await page.getByLabel("Apellido", { exact: false }).fill("Completo");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await go(page, "Suscripciones");
  await page
    .getByRole("button", { name: "Nueva suscripción", exact: true })
    .click();
  const assoc = page
    .locator("#field-asociado_id option")
    .filter({ hasText: "Recorrido Completo" });
  await page
    .getByLabel("Asociado", { exact: false })
    .selectOption(await assoc.getAttribute("value"));
  await page.getByLabel("Inicio de vigencia").fill("2026-03-01");
  await page.getByLabel("Fin de vigencia").fill("2026-03-31");
  await page.getByLabel("Importe").fill("6000");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await go(page, "Libro de caja");
  await page.getByRole("button", { name: "Nuevo movimiento" }).click();
  await page.getByLabel("Importe").fill("6000");
  await page
    .getByLabel("Concepto")
    .fill("Pago Recorrido Completo · recibo DEMO-001");
  await page.getByLabel("Fecha", { exact: false }).fill("2026-03-01");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await go(page, "Pedidos");
  await page.getByRole("button", { name: "Nuevo pedido" }).click();
  const sub = page
    .locator("#field-suscripcion_id option")
    .filter({ hasText: "Recorrido Completo" });
  await page
    .getByLabel("Suscripción", { exact: false })
    .selectOption(await sub.getAttribute("value"));
  await page.getByLabel("Menú", { exact: false }).selectOption({ index: 1 });
  await page.getByLabel("Fecha del pedido").fill("2026-03-03");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const pedidoRow = page
    .getByRole("row")
    .filter({ hasText: "Recorrido Completo" });
  await pedidoRow.getByRole("button", { name: "Cancelar pedido" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(pedidoRow).toContainText("cancelado");
  await pedidoRow
    .getByRole("button", { name: "Reactivar", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(pedidoRow).toContainText("pendiente");
  await go(page, "Entregas");
  await page.getByRole("button", { name: "Nueva entrega" }).click();
  const order = page
    .locator("#field-pedido_id option")
    .filter({ hasText: "Recorrido Completo" });
  const id = await order.getAttribute("value");
  await page.getByLabel("Pedido", { exact: false }).selectOption(id);
  await page.getByLabel("Fecha de entrega").fill("2026-03-03");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Nueva entrega" }).click();
  await page.getByLabel("Pedido", { exact: false }).selectOption(id);
  await page.getByLabel("Fecha de entrega").fill("2026-03-03");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("alert")).toContainText("ya tiene una entrega");
});
test("tablero, períodos vacíos, tres gráficos e impresión del informe", async ({
  page,
}) => {
  await login(page);
  await expect(page.locator(".metric-card").nth(0)).toContainText("54,76");
  await expect(page.locator(".metric-card").nth(1)).toContainText("4");
  await expect(page.locator("figure")).toHaveCount(3);
  await page.getByLabel("Desde", { exact: true }).fill("2027-01-01");
  await page.getByLabel("Hasta", { exact: true }).fill("2027-01-31");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.locator(".metric-card").nth(0)).toContainText(
    "No calculable",
  );
  await expect(page.locator("figure").first()).toContainText("Sin movimientos");
  await go(page, "Informe de seguimiento");
  await expect(
    page.getByRole("heading", { name: "Informe de seguimiento", exact: true }),
  ).toBeVisible();
  await expect(page.locator("figure")).toHaveCount(3);
  await page
    .getByLabel("Agregá la interpretación")
    .fill("Acuerdo de prueba: revisar turnos.");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("aside")).not.toBeVisible();
  await expect(page.locator(".print-only")).toContainText("Acuerdo de prueba");
  await page.pdf({
    path: "test-results/informe-prueba.pdf",
    format: "A4",
    printBackground: true,
  });
});
test("el rol Asociado no accede a datos personales por URL y puede leer el menú", async ({
  page,
}) => {
  await login(page, "Asociado");
  await expect(
    page.locator("aside").getByRole("link", { name: "Asociados", exact: true }),
  ).toHaveCount(0);
  await page.goto("/asociados");
  await expect(page).toHaveURL("/");
  await expect(page.locator("tbody")).toHaveCount(0);
  await go(page, "Menú semanal");
  await expect(page.getByRole("button", { name: "Nuevo menú" })).toHaveCount(0);
});
test("móvil: menú accesible, formulario usable y sin desborde horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await go(page, "Pedidos");
  await expect(page.locator("aside")).not.toHaveClass(/open/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Nuevo pedido" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.getByLabel("Cantidad").isVisible()).toBeTruthy();
});
test("respaldo exportable y rechazo de archivos incompletos sin perder datos", async ({
  page,
}) => {
  await login(page);
  await go(page, "Datos y respaldo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar respaldo" }).click();
  const dl = await downloadPromise;
  expect(dl.suggestedFilename()).toMatch(/\.json$/);
  await page.locator("input[type=file]").setInputFiles({
    name: "invalido.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"data":{}}'),
  });
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("formato");
  await go(page, "Asociados");
  await expect(page.locator("tbody tr")).toHaveCount(10);
});
test("restauración válida persiste tras recarga y la consulta interna no habilita escritura", async ({
  page,
}) => {
  await login(page);
  await go(page, "Datos y respaldo");
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar respaldo" }).click();
  const dl = await promise;
  const fs = await import("node:fs/promises");
  const data = JSON.parse(await fs.readFile(await dl.path(), "utf8"));
  data.data.asociados[0].nombre = "Restaurado";
  await page.locator("input[type=file]").setInputFiles({
    name: "valido.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "actualizados correctamente",
  );
  await page.reload();
  await go(page, "Asociados");
  await expect(page.locator("tbody")).toContainText("Restaurado");
  await page
    .locator("aside")
    .getByRole("button", { name: /Cambiar rol de prueba/ })
    .click();
  await page.getByRole("radio", { name: "Tesorero", exact: true }).check();
  await page.getByRole("button", { name: "Ingresar al sistema" }).click();
  await go(page, "Asociados");
  await expect(
    page.getByRole("button", { name: "Nuevo asociado" }),
  ).toHaveCount(0);
  const message = await page.evaluate(async () => {
    const db = await import("/src/services/db.js");
    try {
      await db.insertar("asociados", { nombre: "No permitido" });
      return "ERROR: permitido";
    } catch (e) {
      return e.message;
    }
  });
  expect(message).toContain("no puede modificar");
});
test("menú, tareas y actas guardan y validan sus datos propios", async ({
  page,
}) => {
  await login(page);
  await go(page, "Menú semanal");
  await page.getByRole("button", { name: "Nuevo menú" }).click();
  await page.getByLabel("Semana o período").fill("Semana de prueba");
  await page.getByLabel("Tipo de vianda").selectOption({ index: 1 });
  await page.getByLabel("Precio por vianda").fill("1500");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("searchbox").fill("Semana de prueba");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await go(page, "Tareas");
  await page.getByRole("button", { name: "Nueva tarea" }).click();
  await page.getByLabel("Comisión responsable").selectOption({ index: 1 });
  await page
    .getByLabel("Descripción de la tarea")
    .fill("Revisar la lista de retiro");
  await page.getByLabel("Fecha de asignación").fill("2026-03-03");
  await page.getByLabel("Fecha límite").fill("2026-03-01");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "plazo no puede ser anterior",
  );
  await page.getByLabel("Fecha límite").fill("2026-03-05");
  await page.getByLabel("Tarea cumplida").selectOption("true");
  await page.getByLabel("Fecha de cumplimiento").fill("2026-03-04");
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await go(page, "Actas");
  await page.getByRole("button", { name: "Nueva acta" }).click();
  await page
    .getByLabel("Contenido del acta")
    .fill(
      "Acta de prueba: se acuerda revisar los turnos. Responsable: Distribución.",
    );
  await page.getByRole("button", { name: "Guardar registro" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("searchbox").fill("Acta de prueba");
  await expect(page.locator("tbody tr")).toHaveCount(1);
});
