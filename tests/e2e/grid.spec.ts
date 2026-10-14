import { expect, test } from "@playwright/test";
import { longPress, signUp } from "./support";

const DAY = "/grilla/2026-11-21";
const block = (page: import("@playwright/test").Page, artist: string) =>
  page.getByRole("button", { name: new RegExp(`^${artist},`) });

test.beforeEach(async ({ page }) => {
  await signUp(page);
});

test("opens the first festival day by default before the festival starts, showing its empty state (FR-090, FR-091)", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/grilla\/2026-11-20$/);
  await expect(page.getByText("No hay shows este día")).toBeVisible();
});

test("offers a day selector and no festival selector (AC-02, FR-030)", async ({ page }) => {
  await page.goto(DAY);
  const days = page.getByRole("navigation", { name: "Días del festival" });

  await expect(days.getByRole("link")).toHaveCount(3);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByText(/elegir festival/i)).toHaveCount(0);

  await days.getByRole("link", { name: /22/ }).click();
  await expect(page).toHaveURL(/2026-11-22$/);
  await expect(block(page, "Delta")).toBeVisible();
  await expect(block(page, "Los Cardos")).toHaveCount(0);
});

test("keeps the 5 columns on a 375 px screen and scrolls both ways to every block (AC-105, AC-106)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(DAY);

  await expect(page.getByRole("columnheader")).toHaveCount(5);
  const scroller = page.getByTestId("grid-scroll");
  const { scrollWidth, clientWidth } = await scroller.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(scrollWidth).toBeGreaterThan(clientWidth);

  for (const artist of ["Los Cardos", "Las Brujas", "Viento Sur", "Noche Larga"]) {
    await block(page, artist).scrollIntoViewIfNeeded();
    await expect(block(page, artist)).toBeInViewport();
  }
});

test("keeps fixed-width columns aligned left without stretching (FR-097)", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto(DAY);
  await expect(page.getByRole("columnheader")).toHaveCount(5);

  const widths = await page.getByRole("columnheader").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  for (const width of widths) expect(Math.abs(width - 140)).toBeLessThan(1);
  const grid = await page.getByTestId("grid-canvas").boundingBox();
  expect(grid!.width).toBeLessThan(1600);
});

test("places the after-midnight show after 23:59 on its festival day (AC-107)", async ({ page }) => {
  await page.goto(DAY);

  const late = await block(page, "Noche Larga").boundingBox();
  const evening = await block(page, "Las Brujas").boundingBox();
  expect(late!.y).toBeGreaterThan(evening!.y + evening!.height);
});

test("opens the detail with a long press without changing the selection (AC-35)", async ({ page }) => {
  await page.goto(DAY);
  const cardos = block(page, "Los Cardos");
  const pressedBefore = await cardos.getAttribute("aria-pressed");

  await longPress(page, cardos);

  const dialog = page.getByRole("dialog", { name: "Los Cardos" });
  await expect(dialog).toContainText("Rock de la costa");
  await expect(dialog).toContainText("Escenario Norte");
  await expect(dialog).toContainText("18:00");
  await expect(dialog).toContainText("19:00");
  await dialog.getByRole("button", { name: "Cerrar" }).click();
  expect(await cardos.getAttribute("aria-pressed")).toBe(pressedBefore);
});

test("opens the detail from 'Ver detalle' with the keyboard (FR-085)", async ({ page }) => {
  await page.goto(DAY);

  const detail = page.getByRole("button", { name: "Ver detalle de Las Brujas" });
  await detail.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("dialog", { name: "Las Brujas" })).toContainText("Cumbia");
});
