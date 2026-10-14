import { expect, test } from "@playwright/test";
import { signUp } from "./support";

test("downloads the personal grid as PNG in each format (AC-87, AC-88, FR-070)", async ({ page }) => {
  await signUp(page);
  await page.goto("/grilla/2026-11-21");

  await page.getByRole("button", { name: "Exportar imagen" }).click();
  const dialog = page.getByRole("dialog", { name: "Exportar imagen" });
  await expect(dialog.getByLabel("Día")).toHaveValue("2026-11-21");
  await expect(dialog.getByLabel(/nombres/i)).toHaveCount(0);

  const story = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Descargar PNG" }).click();
  expect((await story).suggestedFilename()).toBe("grilla-personal-2026-11-21-1080x1920.png");

  await page.getByRole("button", { name: "Exportar imagen" }).click();
  await dialog.getByLabel("Día").selectOption("2026-11-22");
  await dialog.getByRole("radio", { name: /1080 × 1350/ }).check();
  const post = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Descargar PNG" }).click();
  expect((await post).suggestedFilename()).toBe("grilla-personal-2026-11-22-1080x1350.png");
});

test("offers the explicit names option only in the group export (FR-073)", async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  await signUp(page);
  await page.goto("/grupo");
  await page.getByLabel("Nombre del grupo").fill("Exportadores");
  await page.getByRole("button", { name: "Crear grupo" }).click();
  await expect(page.getByRole("heading", { name: "Exportadores" })).toBeVisible();
  await page.goto("/grupo/vista/2026-11-21");

  await page.getByRole("button", { name: "Exportar imagen" }).click();
  const dialog = page.getByRole("dialog", { name: "Exportar imagen" });
  const names = dialog.getByRole("checkbox", { name: "Incluir nombres de quienes coinciden" });
  await expect(names).not.toBeChecked();
  await names.check();

  const request = page.waitForRequest((r) => r.url().includes("/api/export"));
  const download = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Descargar PNG" }).click();
  expect(new URL((await request).url()).searchParams.get("names")).toBe("1");
  expect((await download).suggestedFilename()).toBe("grilla-grupo-2026-11-21-1080x1920.png");
});
