import { expect, test, type Browser, type Page } from "@playwright/test";
import { signUp, uniqueUsername } from "./support";

async function person(browser: Browser, prefix: string): Promise<{ page: Page; username: string }> {
  const page = await (await browser.newContext()).newPage();
  const username = await signUp(page, uniqueUsername(prefix));
  return { page, username };
}

test("create a group, invite by username, accept and leave (AC-44, AC-50, AC-51, AC-54, AC-61)", async ({ browser }) => {
  const owner = await person(browser, "own");
  const guest = await person(browser, "gst");

  await owner.page.goto("/grupo");
  await expect(owner.page.getByText("Todavía no tenés grupo")).toBeVisible();
  await owner.page.getByLabel("Nombre del grupo").fill("Los del sur");
  await owner.page.getByRole("button", { name: "Crear grupo" }).click();
  await expect(owner.page.getByRole("heading", { name: "Los del sur" })).toBeVisible();
  const ownerMembers = owner.page.getByRole("list", { name: "Miembros" });
  await expect(ownerMembers).toContainText(owner.username);
  await expect(ownerMembers).toContainText("propietario");

  await expect(owner.page.locator('input[type="email"]')).toHaveCount(0);
  await owner.page.getByLabel("Nombre de usuario a invitar").fill(guest.username);
  await owner.page.getByRole("button", { name: "Invitar" }).click();
  const pending = owner.page.getByRole("list", { name: "Invitaciones pendientes" });
  await expect(pending).toContainText(guest.username);
  await expect(pending).toContainText(/vence a las \d{2}:\d{2}/);

  await guest.page.goto("/invitaciones");
  const received = guest.page.getByRole("listitem").filter({ hasText: "Los del sur" });
  await expect(received).toContainText(owner.username);
  await received.getByRole("button", { name: "Aceptar" }).click();
  await expect(guest.page).toHaveURL(/\/grupo$/);
  await expect(guest.page.getByRole("list", { name: "Miembros" })).toContainText(owner.username);

  // A non-owner member has no owner controls.
  await expect(guest.page.getByRole("button", { name: "Invitar" })).toHaveCount(0);
  await expect(guest.page.getByRole("button", { name: "Eliminar grupo" })).toHaveCount(0);

  await owner.page.reload();
  await expect(owner.page.getByRole("list", { name: "Miembros" })).toContainText(guest.username);

  guest.page.once("dialog", (dialog) => dialog.accept());
  await guest.page.getByRole("button", { name: "Abandonar grupo" }).click();
  await expect(guest.page.getByText("Todavía no tenés grupo")).toBeVisible();
});

test("the owner cancels an invitation and it disappears for the invitee (AC-111)", async ({ browser }) => {
  const owner = await person(browser, "own");
  const guest = await person(browser, "gst");

  await owner.page.goto("/grupo");
  await owner.page.getByLabel("Nombre del grupo").fill("Cancelables");
  await owner.page.getByRole("button", { name: "Crear grupo" }).click();
  await owner.page.getByLabel("Nombre de usuario a invitar").fill(guest.username);
  await owner.page.getByRole("button", { name: "Invitar" }).click();
  await owner.page.getByRole("button", { name: `Cancelar invitación a ${guest.username}` }).click();
  await expect(owner.page.getByRole("list", { name: "Invitaciones pendientes" })).toHaveCount(0);

  await guest.page.goto("/invitaciones");
  await expect(guest.page.getByText("No tenés invitaciones pendientes")).toBeVisible();
});

test("explains why an invitation cannot be sent", async ({ browser }) => {
  const owner = await person(browser, "own");

  await owner.page.goto("/grupo");
  await owner.page.getByLabel("Nombre del grupo").fill("Errores");
  await owner.page.getByRole("button", { name: "Crear grupo" }).click();
  await owner.page.getByLabel("Nombre de usuario a invitar").fill("nadie_existe_123");
  await owner.page.getByRole("button", { name: "Invitar" }).click();

  await expect(owner.page.getByText("No existe una persona con ese nombre de usuario.")).toBeVisible();
});
