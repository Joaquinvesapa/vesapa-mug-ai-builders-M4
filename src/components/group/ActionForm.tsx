"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/server/actions/groups";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
  /** Asks before submitting destructive actions. */
  confirmMessage?: string;
};

export function ActionForm({ action, children, className, confirmMessage }: Props) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {children}
      {state.error && (
        <p role="alert" className="w-full text-sm text-red-300">
          {state.error}
        </p>
      )}
    </form>
  );
}
