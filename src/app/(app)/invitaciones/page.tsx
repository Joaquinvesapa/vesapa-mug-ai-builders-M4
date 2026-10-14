import { Suspense } from "react";
import { ActionForm } from "@/components/group/ActionForm";
import { primaryButton, secondaryButton } from "@/components/ui";
import { formatFestivalTime } from "@/domain/time";
import { acceptInvitationAction, rejectInvitationAction } from "@/server/actions/groups";
import { listReceivedInvitations } from "@/server/groups/invitation-service";
import { requirePageUser } from "@/server/page-session";

export default function InvitationsPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Invitaciones</h1>
      <Suspense fallback={<p className="text-neutral-400">Cargando invitaciones…</p>}>
        <ReceivedInvitations />
      </Suspense>
    </main>
  );
}

async function ReceivedInvitations() {
  const user = await requirePageUser();
  const invitations = await listReceivedInvitations(user.id);

  if (invitations.length === 0) return <p className="text-neutral-300">No tenés invitaciones pendientes.</p>;

  return (
    <ul className="flex flex-col divide-y divide-neutral-800">
      {invitations.map((invitation) => (
        <li key={invitation.id} className="flex flex-col gap-2 py-3">
          <p>
            <span className="font-bold">{invitation.groupName}</span>
            <span className="text-neutral-400"> · de {invitation.ownerUsername}</span>
          </p>
          <p className="text-sm text-neutral-400">Vence a las {formatFestivalTime(invitation.expiresAt)}</p>
          <div className="flex gap-2">
            <ActionForm action={acceptInvitationAction}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <button type="submit" className={primaryButton}>
                Aceptar
              </button>
            </ActionForm>
            <ActionForm action={rejectInvitationAction}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <button type="submit" className={secondaryButton}>
                Rechazar
              </button>
            </ActionForm>
          </div>
        </li>
      ))}
    </ul>
  );
}
