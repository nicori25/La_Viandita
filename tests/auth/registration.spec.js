import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:5176/La_Viandita/",
  project = "https://skctpovhhavsxoryhbjz.supabase.co";
const user = {
  id: "00000000-0000-4000-8000-000000000002",
  aud: "authenticated",
  role: "authenticated",
  email: "registro@example.test",
  app_metadata: { provider: "email" },
  user_metadata: { nombre: "Prueba Registro" },
  created_at: "2026-01-01T00:00:00Z",
};
const now = Math.floor(Date.now() / 1000),
  encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
const session = {
  access_token:
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({ sub: user.id, exp: now + 3600, iat: now, aud: "authenticated" }) +
    ".fake-test-signature",
  refresh_token: "fake-test-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user,
};
async function setup(page) {
  await page.route(project + "/**", (r) =>
    r.fulfill({ status: 400, json: { message: "Unexpected mocked request" } }),
  );
  await page.goto(base);
  await page.getByRole("link", { name: "Crear cuenta", exact: true }).click();
}
async function fill(page) {
  await page.getByLabel("Nombre completo").fill("Prueba Registro");
  await page.getByLabel("Correo electrónico").fill("registro@example.test");
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("Mi clave de prueba 123");
  await page.getByLabel("Repetir contraseña").fill("Mi clave de prueba 123");
}
test("registro validado y confirmación por correo sin elegir privilegios", async ({
  page,
}) => {
  await setup(page);
  let call = null;
  let profileCalls = 0;
  await page.route(project + "/auth/v1/signup**", async (r) => {
    call = { body: r.request().postDataJSON(), url: r.request().url() };
    await r.fulfill({ status: 200, json: { user } });
  });
  await page.route(project + "/rest/v1/rpc/asegurar_mi_perfil", (r) => {
    profileCalls++;
    return r.fulfill({ status: 400, json: {} });
  });
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("nombre completo");
  expect(call).toBe(null);
  await fill(page);
  await page.getByLabel("Repetir contraseña").fill("diferente");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("no coinciden");
  expect(call).toBe(null);
  await page.getByLabel("Repetir contraseña").fill("Mi clave de prueba 123");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("confirmá tu cuenta");
  expect(call.body.email).toBe(user.email);
  expect(call.body.data).toEqual({ nombre: "Prueba Registro" });
  expect(new URL(call.url).searchParams.get("redirect_to")).toBe(base);
  expect(profileCalls).toBe(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
});
test("con sesión crea solo el perfil propio y entra como Asociado", async ({
  page,
}) => {
  await setup(page);
  let rpcBody;
  await page.route(project + "/auth/v1/signup**", (r) =>
    r.fulfill({ status: 200, json: session }),
  );
  await page.route(project + "/rest/v1/usuarios**", (r) =>
    r.fulfill({ status: 406, json: { code: "PGRST116", message: "No rows" } }),
  );
  await page.route(project + "/rest/v1/rpc/asegurar_mi_perfil", async (r) => {
    rpcBody = r.request().postDataJSON();
    await r.fulfill({
      status: 200,
      json: { rol: "asociado", nombre: "Prueba Registro", activo: true },
    });
  });
  await page.route(project + "/rest/v1/rpc/resumen_periodo", (r) =>
    r.fulfill({
      status: 200,
      json: {
        ingresos: 0,
        egresos: 0,
        vigentes: 0,
        entregas: 0,
        enHorario: 0,
        tareas: 0,
        cumplidas: 0,
        pedidos: 0,
      },
    }),
  );
  await fill(page);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Así va nuestra cooperativa" }),
  ).toBeVisible();
  expect(rpcBody).toEqual({});
  await expect(
    page.locator("aside").getByRole("link", { name: "Asociados", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .locator("aside")
      .getByRole("link", { name: "Menú semanal", exact: true }),
  ).toBeVisible();
});
test("si falta la migración avisa que la cuenta se creó y no promete acceso", async ({
  page,
}) => {
  await setup(page);
  await page.route(project + "/auth/v1/signup**", (r) =>
    r.fulfill({ status: 200, json: session }),
  );
  await page.route(project + "/rest/v1/usuarios**", (r) =>
    r.fulfill({ status: 406, json: { code: "PGRST116" } }),
  );
  await page.route(project + "/rest/v1/rpc/asegurar_mi_perfil", (r) =>
    r.fulfill({ status: 404, json: { code: "PGRST202" } }),
  );
  await fill(page);
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Tu cuenta se creó");
  await expect(page.getByRole("alert")).toContainText("complete la configuración");
  await expect(
    page.getByRole("button", { name: "Crear cuenta", exact: true }),
  ).toHaveCount(0);
});
