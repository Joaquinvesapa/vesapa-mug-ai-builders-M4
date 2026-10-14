import type { Page } from "@playwright/test";

export function uniqueUsername(prefix = "u") {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`.slice(0, 30);
}

/** Creates an account through the PIN API; the session cookie lands in the page context. */
export async function signUp(page: Page, username = uniqueUsername(), pin = "482913") {
  const response = await page.request.post("/api/auth/pin", { data: { username, pin } });
  if (!response.ok()) throw new Error(`sign-up failed: ${response.status()}`);
  return username;
}

/** Excludes the route announcer that Next.js renders with role="alert". */
export const alertOf = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

export async function longPress(page: Page, selector: ReturnType<Page["locator"]>, ms = 650) {
  await selector.scrollIntoViewIfNeeded();
  const box = await selector.boundingBox();
  if (!box) throw new Error("element not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 12));
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}
