import { test, expect } from "@playwright/test";
async function logoReady(locator) {
  await expect(locator).toBeVisible();
  expect(
    await locator.evaluate((img) => img.complete && img.naturalWidth > 0),
  ).toBeTruthy();
}
test("identidad principal en ingreso, navegación, móvil e informe imprimible", async ({
  page,
}) => {
  await page.goto("/");
  await logoReady(page.locator(".brand-logo--login img"));
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    /branding\/la-viandita-logo\.png$/,
  );
  await page
    .getByRole("radio", { name: "Administración", exact: true })
    .check();
  await page.getByRole("button", { name: "Ingresar al sistema" }).click();
  await logoReady(page.locator(".brand-logo--sidebar img"));
  await logoReady(page.locator(".brand-logo--hero img"));
  await page
    .locator("aside")
    .getByRole("link", { name: "Informe de seguimiento", exact: true })
    .click();
  await page.locator(".metric-card").first().waitFor();
  await logoReady(page.locator(".brand-logo--report img"));
  await page.emulateMedia({ media: "print" });
  await logoReady(page.locator(".brand-logo--report img"));
  await expect(page.locator("aside")).not.toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.setViewportSize({ width: 390, height: 844 });
  await logoReady(page.locator(".brand-logo--topbar img"));
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await logoReady(page.locator(".brand-logo--sidebar img"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
