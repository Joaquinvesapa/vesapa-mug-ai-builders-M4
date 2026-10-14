import { expect, test, type Page } from "@playwright/test";
import { clickAndWaitForAction, signUp } from "./support";

const DAY = "/grilla/2026-11-21";
const block = (page: Page, artist: string) => page.getByRole("button", { name: new RegExp(`^${artist},`) });

test.beforeEach(async ({ page }) => {
  await signUp(page);
  await page.goto(DAY);
});

test("a tap selects and highlights a block, and the selection persists (AC-36, AC-38, AC-40)", async ({ page }) => {
  await clickAndWaitForAction(page, block(page, "Los Cardos"));
  await clickAndWaitForAction(page, block(page, "Las Brujas"));
  await expect(block(page, "Los Cardos")).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(2);

  await clickAndWaitForAction(page, block(page, "Los Cardos"));
  await expect(block(page, "Los Cardos")).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(1);
});

test("adds and removes a show from the detail (AC-37, AC-39)", async ({ page }) => {
  await page.getByRole("button", { name: "Ver detalle de Viento Sur" }).click();
  await page.getByRole("button", { name: "Agregar a mi grilla" }).click();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(block(page, "Viento Sur")).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Ver detalle de Viento Sur" }).click();
  await page.getByRole("button", { name: "Quitar de mi grilla" }).click();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(block(page, "Viento Sur")).toHaveAttribute("aria-pressed", "false");
});

test("warns about overlapping selections and not about contiguous ones (AC-41, AC-42, FR-092)", async ({ page }) => {
  await block(page, "Mar de Fondo").click();
  await block(page, "Trío Pampa").click();
  await expect(page.getByText(/Se superponen/)).toHaveCount(0);

  await block(page, "Los Cardos").click();
  const warning = page.getByRole("status");
  await expect(warning).toContainText("Los Cardos");
  await expect(warning).toContainText("Trío Pampa");
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(3);
});

test("shows the temporal status on the person's own shows (FR-043)", async ({ page }) => {
  await block(page, "Los Cardos").click();

  await expect(block(page, "Los Cardos")).toHaveAccessibleName(/próximo$/);
});
