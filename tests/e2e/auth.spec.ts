import { expect, test } from "@playwright/test";
import { alertOf, uniqueUsername } from "./support";

test.describe("access with username and PIN", () => {
  test("redirects to /login without a session and offers no email access (FR-018)", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
    await expect(page.getByText(/correo|email/i)).toHaveCount(0);
  });

  test("signs up, signs out and signs in again (AC-07, AC-10)", async ({ page, context }) => {
    const username = uniqueUsername();

    await page.goto("/login");
    await page.getByLabel("Nombre de usuario").fill(username);
    await page.getByLabel("PIN de 6 dígitos").fill("482913");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/grilla\/\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByRole("banner")).toContainText("Festival de demostración");
    await expect(page.getByRole("banner")).toContainText(username);

    const session = (await context.cookies()).find((c) => c.name.endsWith("authjs.session-token"));
    const days = ((session?.expires ?? 0) * 1000 - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect(session?.httpOnly).toBe(true);

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Nombre de usuario").fill(username.toUpperCase());
    await page.getByLabel("PIN de 6 dígitos").fill("482913");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("banner")).toContainText(username);
  });

  test("shows a generic error for a wrong PIN (AC-09)", async ({ page }) => {
    const username = uniqueUsername();
    await page.request.post("/api/auth/pin", { data: { username, pin: "482913" } });
    await page.context().clearCookies();

    await page.goto("/login");
    await page.getByLabel("Nombre de usuario").fill(username);
    await page.getByLabel("PIN de 6 dígitos").fill("111111");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(alertOf(page)).toHaveText("Nombre de usuario o PIN incorrectos.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("explains a failed or cancelled Google sign-in (FR-096)", async ({ page }) => {
    await page.goto("/login?error=OAuthCallbackError");

    await expect(alertOf(page)).toHaveText("No se pudo iniciar sesión con Google");
  });
});
