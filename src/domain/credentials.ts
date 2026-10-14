const PIN_PATTERN = /^[0-9]{6}$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{3,30}$/;

/** A PIN is exactly 6 ASCII digits (FR-010). */
export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

/** 3-30 characters: unaccented letters, digits, dot and underscore (FR-016). */
export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

/** Case-insensitive identity of a username. */
export function usernameKey(username: string): string {
  return username.toLowerCase();
}
