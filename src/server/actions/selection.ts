"use server";

import { requireActionUser } from "@/server/page-session";
import { setSelection } from "@/server/selection";

/** Selection always applies to the signed-in person; no user id is accepted from the client. */
export async function setSelectionAction(showId: string, selected: boolean): Promise<void> {
  const user = await requireActionUser();
  const result = await setSelection(user.id, showId, selected);
  if (result.status === "not_found") throw new Error("not_found");
}
