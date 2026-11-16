import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:5176/La_Viandita/";
const project = "https://skctpovhhavsxoryhbjz.supabase.co";
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "prueba@example.test",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
async function mockAuth(page) {
  await page.route(project + "/**", (route) =>
    route.fulfill({
      status: 400,
      json: { message: "Unexpected test request" },
    }),
  );
}
test("solicita enlace con la URL correcta de Pages; no envía correos reales", async ({
  page,
}) => {
  await mockAuth(page);
  let call;
  await page.route(project + "/auth/v1/recover**", async (route) => {
    call = { body: route.request().postDataJSON(), url: route.request().url() };
    await route.fulfill({ status: 200, json: {} });
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Olvidé mi contraseña" }).click();
  await page.getByLabel("Correo de tu cuenta").fill("prueba@example.test");
  await page
    .getByRole("button", { name: "Enviar enlace", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Si existe una cuenta");
  expect(call.body.email).toBe("prueba@example.test");
  expect(new URL(call.url).searchParams.get("redirect_to")).toBe(
    base + "?recuperar=1",
  );
});
test("sin sesión el formulario no permite cambiar ninguna contraseña", async ({
  page,
}) => {
  await mockAuth(page);
  await page.goto(base + "#/restablecer");
  await expect(
    page.getByText("No hay una sesión válida", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Guardar nueva contraseña" }),
  ).toHaveCount(0);
});
test("el enlace abre el formulario y confirma la contraseña, incluso al recargar", async ({
  page,
}) => {
  await mockAuth(page);
  let changed = null;
  await page.route(project + "/auth/v1/user", async (route) => {
    if (route.request().method() === "PUT")
      changed = route.request().postDataJSON();
    await route.fulfill({ status: 200, json: user });
  });
  await page.route(project + "/auth/v1/logout**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  const now = Math.floor(Date.now() / 1000);
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const jwt =
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({ sub: user.id, exp: now + 3600, iat: now, aud: "authenticated" }) +
    ".fake-test-signature";
  await page.goto(
    base +
      "?recuperar=1#access_token=" +
      jwt +
      "&refresh_token=fake-refresh-test&expires_in=3600&expires_at=" +
      (now + 3600) +
      "&token_type=bearer&type=recovery",
  );
  await expect(
    page.getByLabel("Nueva contraseña", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Nueva contraseña", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Nueva contraseña", { exact: true })
    .fill("Clave ficticia 1234");
  await page.getByLabel("Repetir contraseña").fill("otra clave diferente");
  await page.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await expect(page.getByRole("alert")).toContainText("no coinciden");
  expect(changed).toBe(null);
  await page.getByLabel("Repetir contraseña").fill("Clave ficticia 1234");
  await page.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Contraseña actualizada",
  );
  expect(changed.password).toBe("Clave ficticia 1234");
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
});
