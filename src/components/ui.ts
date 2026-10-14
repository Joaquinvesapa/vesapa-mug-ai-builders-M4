/** Shared Tailwind class lists for form controls. */
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
export const inputClass = `rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 ${focusRing}`;
export const primaryButton = `rounded-lg bg-violet-600 px-4 py-2 font-bold text-white disabled:opacity-60 ${focusRing}`;
export const secondaryButton = `rounded-lg border border-neutral-600 px-3 py-1.5 text-sm ${focusRing}`;
export const dangerButton = `rounded-lg border border-red-500 px-3 py-1.5 text-sm text-red-300 ${focusRing}`;
