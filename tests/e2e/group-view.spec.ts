import { expect, test, type Browser, type Page } from "@playwright/test";
import { clickAndWaitForAction, signUp, uniqueUsername } from "./support";

const DAY = "2026-11-21";
const block = (page: Page, artist: string) => page.getByRole("button", { name: new RegExp(`^${artist},`) });

async function person(browser: Browser, prefix: string) {
  const page = await (await browser.newContext()).newPage();
  const username = await signUp(page, uniqueUsername(prefix));
  return { page, username };
}

/** Owner creates a group and the guest joins it through the UI. */
async function formGroup(owner: { page: Page }, guest: { page: Page; username: string }) {
  await owner.page.goto("/grupo");
  await owner.page.getByLabel("Nombre del grupo").fill("Coincidentes");
  await owner.page.getByRole("button", { name: "Crear grupo" }).click();
  await owner.page.getByLabel("Nombre de usuario a invitar").fill(guest.username);
  await owner.page.getByRole("button", { name: "Invitar" }).click();
  await expect(owner.page.getByRole("list", { name: "Invitaciones pendientes" })).toContainText(guest.username);
  await guest.page.goto("/invitaciones");
  await guest.page.getByRole("button", { name: "Aceptar" }).click();
  await expect(guest.page).toHaveURL(/\/grupo$/);
}

async function select(page: Page, ...artists: string[]) {
  await page.goto(`/grilla/${DAY}`);
  for (const artist of artists) await clickAndWaitForAction(page, block(page, artist));
}

test("shows counts and matches in the grid and an ordered, filterable list (AC-70 to AC-78, FR-062)", async ({ browser }) => {
  const owner = await person(browser, "own");
  const guest = await person(browser, "gst");
  await formGroup(owner, guest);
  await select(owner.page, "Los Cardos", "Las Brujas");
  await select(guest.page, "Los Cardos");

  await owner.page.goto("/grupo");
  await owner.page.getByRole("link", { name: "Ver coincidencias del grupo" }).click();
  await owner.page.getByRole("navigation", { name: "Días del festival" }).getByRole("link", { name: /21/ }).click();
  await expect(owner.page).toHaveURL(new RegExp(`/grupo/vista/${DAY}$`));

  await expect(block(owner.page, "Los Cardos")).toHaveAccessibleName(/2 del grupo, coincidencia$/);
  await expect(block(owner.page, "Las Brujas")).toHaveAccessibleName(/1 del grupo$/);
  await expect(block(owner.page, "Los Cardos")).toHaveAttribute("aria-pressed", "true");
  await owner.page.getByRole("button", { name: "Ver detalle de Los Cardos" }).click();
  const detail = owner.page.getByRole("dialog", { name: "Los Cardos" });
  await expect(detail).toContainText(owner.username);
  await expect(detail).toContainText(guest.username);
  await detail.getByRole("button", { name: "Cerrar", exact: true }).click();

  await owner.page.getByRole("tab", { name: "Lista" }).click();
  const rows = owner.page.getByRole("list", { name: "Shows elegidos por el grupo" }).getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await owner.page.getByRole("radio", { name: "Cantidad" }).check();
  await expect(rows.first()).toContainText("Los Cardos");
  await expect(rows.first()).toContainText(guest.username);
  await expect(rows.nth(1)).not.toContainText(owner.username);
  await owner.page.getByRole("checkbox", { name: "Solo coincidencias" }).check();
  await expect(rows).toHaveCount(1);

  // AC-78: the guest drops the show and the owner refreshes the view.
  await select(guest.page, "Los Cardos");
  await owner.page.getByRole("button", { name: "Actualizar" }).click();
  await expect(rows).toHaveCount(0);
  await owner.page.getByRole("tab", { name: "Grilla" }).click();
  await expect(block(owner.page, "Los Cardos")).toHaveAccessibleName(/1 del grupo$/);
});

test("shows an empty state when nobody in the group chose a show that day (FR-090)", async ({ browser }) => {
  const owner = await person(browser, "own");
  const guest = await person(browser, "gst");
  await formGroup(owner, guest);

  await owner.page.goto("/grupo/vista/2026-11-22");

  await expect(owner.page.getByText("Nadie del grupo eligió shows este día")).toBeVisible();
});

test("sends a removed member back to /grupo on refresh and denies outsiders (AC-79, FR-094)", async ({ browser }) => {
  const owner = await person(browser, "own");
  const guest = await person(browser, "gst");
  const outsider = await person(browser, "out");
  await formGroup(owner, guest);
  await select(owner.page, "Los Cardos");

  await guest.page.goto(`/grupo/vista/${DAY}`);
  await expect(block(guest.page, "Los Cardos")).toHaveAccessibleName(/1 del grupo$/);

  await owner.page.goto("/grupo");
  owner.page.once("dialog", (dialog) => dialog.accept());
  await owner.page.getByRole("button", { name: `Eliminar a ${guest.username}` }).click();
  await expect(owner.page.getByRole("list", { name: "Miembros" })).not.toContainText(guest.username);

  await guest.page.getByRole("button", { name: "Actualizar" }).click();
  await expect(guest.page).toHaveURL(/\/grupo\?aviso=removido$/);
  await expect(guest.page.getByText("Ya no sos miembro de este grupo")).toBeVisible();

  await outsider.page.goto(`/grupo/vista/${DAY}`);
  await expect(outsider.page).toHaveURL(/\/grupo$/);
  await expect(outsider.page.getByText(/\d+ del grupo/)).toHaveCount(0);
});
