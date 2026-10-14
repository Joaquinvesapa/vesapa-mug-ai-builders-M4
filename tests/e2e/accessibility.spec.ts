import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { clickAndWaitForAction, signUp } from "./support";

/** WCAG 2.x A and AA rules, including color contrast (FR-085). */
async function expectNoViolations(page: Page) {
  // Dynamic pages stream their metadata; audit once the title has arrived.
  await expect(page).toHaveTitle(/Festival Social Grid/);
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(summary).toEqual([]);
}

test("the login page has no WCAG AA violations", async ({ page }) => {
  await page.goto("/login");
  await expectNoViolations(page);
});

test("the personal grid has no WCAG AA violations, with selected and unselected blocks", async ({ page }) => {
  await signUp(page);
  await page.goto("/grilla/2026-11-21");
  await clickAndWaitForAction(page, page.getByRole("button", { name: /^Los Cardos,/ }));
  await clickAndWaitForAction(page, page.getByRole("button", { name: /^Trío Pampa,/ }));

  await expectNoViolations(page);

  await page.getByRole("button", { name: "Ver detalle de Los Cardos" }).click();
  await expectNoViolations(page);
});

test("group, invitations, profile and group view pages have no WCAG AA violations", async ({ page }) => {
  await signUp(page);
  for (const path of ["/grupo", "/invitaciones", "/perfil"]) {
    await page.goto(path);
    await expectNoViolations(page);
  }

  await page.goto("/grupo");
  await page.getByLabel("Nombre del grupo").fill("Accesibles");
  await page.getByRole("button", { name: "Crear grupo" }).click();
  await expect(page.getByRole("heading", { name: "Accesibles" })).toBeVisible();
  await expectNoViolations(page);

  await page.goto("/grilla/2026-11-21");
  await clickAndWaitForAction(page, page.getByRole("button", { name: /^Los Cardos,/ }));
  await page.goto("/grupo/vista/2026-11-21");
  await expectNoViolations(page);
  await page.getByRole("tab", { name: "Lista" }).click();
  await expectNoViolations(page);
});

test("shows a visible focus indicator on keyboard navigation (FR-085)", async ({ page }) => {
  await signUp(page);
  await page.goto("/grilla/2026-11-21");
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  await expect(page.getByRole("columnheader").first()).toBeVisible();

  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return { tag: el.tagName, style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline, `focus #${i + 1}`).not.toBeNull();
    expect(outline!.style, `focus #${i + 1} on ${outline!.tag}`).not.toBe("none");
    expect(outline!.width).toBeGreaterThanOrEqual(2);
  }
});

test("every block offers 'Ver detalle' as an alternative to the long press (FR-085)", async ({ page }) => {
  await signUp(page);
  await page.goto("/grilla/2026-11-21");
  await expect(page.getByRole("columnheader").first()).toBeVisible();

  const blocks = page.getByRole("button", { name: /, \d{2}:\d{2} a \d{2}:\d{2}/ });
  const count = await blocks.count();
  expect(count).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: /^Ver detalle de / })).toHaveCount(count);
});
