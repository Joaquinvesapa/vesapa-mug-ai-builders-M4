import { expect, test } from "@playwright/test";
import { signUp, uniqueUsername } from "./support";

test("shows and edits the own profile (AC-23 to AC-26, FR-020)", async ({ page }) => {
  const username = await signUp(page);
  await page.goto("/perfil");

  await expect(page.getByRole("heading", { name: "Perfil" })).toBeVisible();
  await expect(page.getByText("Acceso con nombre de usuario y PIN")).toBeVisible();
  await expect(page.getByLabel("Nombre de usuario")).toHaveValue(username);

  await page.getByRole("radio", { name: "estrella" }).check();
  await page.getByRole("radio", { name: "esmeralda" }).check();
  await page.getByRole("button", { name: "Guardar avatar" }).click();
  await expect(page.getByRole("img", { name: "Avatar: estrella esmeralda" }).first()).toBeVisible();

  const renamed = uniqueUsername("nuevo");
  await page.getByLabel("Nombre de usuario").fill(renamed);
  await page.getByRole("button", { name: "Guardar nombre" }).click();
  await expect(page.getByRole("banner")).toContainText(renamed);
  await page.reload();
  await expect(page.getByLabel("Nombre de usuario")).toHaveValue(renamed);
});

test("rejects a username that is already taken (AC-14)", async ({ browser }) => {
  const other = await (await browser.newContext()).newPage();
  const taken = await signUp(other);
  const page = await (await browser.newContext()).newPage();
  await signUp(page);
  await page.goto("/perfil");

  await page.getByLabel("Nombre de usuario").fill(taken.toUpperCase());
  await page.getByRole("button", { name: "Guardar nombre" }).click();

  await expect(page.getByText("Ese nombre de usuario ya está en uso.")).toBeVisible();
});

test("suggests people by username prefix when inviting (AC-27, FR-022)", async ({ browser }) => {
  const guestPage = await (await browser.newContext()).newPage();
  const guest = await signUp(guestPage, uniqueUsername("zq"));
  const page = await (await browser.newContext()).newPage();
  await signUp(page);
  await page.goto("/grupo");
  await page.getByLabel("Nombre del grupo").fill("Buscadores");
  await page.getByRole("button", { name: "Crear grupo" }).click();

  const input = page.getByRole("combobox", { name: "Nombre de usuario a invitar" });
  // A prefix long enough to be unique among the many test accounts (the search returns at most 10).
  await input.fill(guest.slice(0, -1));
  const option = page.getByRole("option", { name: new RegExp(guest) });
  await expect(option).toBeVisible();
  await option.click();
  await expect(input).toHaveValue(guest);

  await page.getByRole("button", { name: "Invitar" }).click();
  await expect(page.getByRole("list", { name: "Invitaciones pendientes" })).toContainText(guest);
});
