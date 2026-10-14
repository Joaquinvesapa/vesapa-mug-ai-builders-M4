import Link from "next/link";
import { Suspense } from "react";
import { festival } from "@config/festival";
import { ActionForm } from "@/components/group/ActionForm";
import { InviteUserInput } from "@/components/group/InviteUserInput";
import { dangerButton, inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { defaultFestivalDay } from "@/domain/festival-days";
import { formatFestivalTime } from "@/domain/time";
import {
  cancelInvitationAction,
  createGroupAction,
  deleteGroupAction,
  inviteAction,
  leaveGroupAction,
  removeMemberAction,
  renameGroupAction,
  transferOwnershipAction,
} from "@/server/actions/groups";
import { getMyGroup } from "@/server/groups/group-service";
import { requirePageUser } from "@/server/page-session";

export default function GroupPage({ searchParams }: PageProps<"/grupo">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4">
      <Suspense fallback={<p className="text-neutral-400">Cargando el grupo…</p>}>
        <GroupContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function GroupContent({ searchParams }: { searchParams: PageProps<"/grupo">["searchParams"] }) {
  const user = await requirePageUser();
  const group = await getMyGroup(user.id);

  if (!group) {
    const { aviso } = await searchParams;
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Grupo</h1>
        {aviso === "removido" && (
          <p role="status" className="rounded-lg border border-amber-500 bg-amber-950 px-3 py-2 text-amber-100">
            Ya no sos miembro de este grupo
          </p>
        )}
        <p className="text-neutral-300">Todavía no tenés grupo. Creá uno o aceptá una invitación.</p>
        <ActionForm action={createGroupAction} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span>Nombre del grupo</span>
            <input name="name" required maxLength={40} className={inputClass} />
          </label>
          <button type="submit" className={primaryButton}>
            Crear grupo
          </button>
        </ActionForm>
      </section>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Link
          href={`/grupo/vista/${defaultFestivalDay(festival.days, new Date())}`}
          className="self-start rounded-lg bg-violet-600 px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Ver coincidencias del grupo
        </Link>
        {group.isOwner && (
          <ActionForm action={renameGroupAction} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span>Renombrar grupo</span>
              <input name="name" required maxLength={40} defaultValue={group.name} className={inputClass} />
            </label>
            <button type="submit" className={secondaryButton}>
              Guardar nombre
            </button>
          </ActionForm>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">Miembros ({group.members.length}/15)</h2>
        <ul aria-label="Miembros" className="flex flex-col divide-y divide-neutral-800">
          {group.members.map((member) => (
            <li key={member.userId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {member.username}
                {member.isOwner && <span className="ml-2 text-sm text-neutral-400">(propietario)</span>}
              </span>
              {group.isOwner && !member.isOwner && (
                <span className="flex gap-2">
                  <ActionForm
                    action={transferOwnershipAction}
                    confirmMessage={`¿Transferir la propiedad del grupo a ${member.username}?`}
                  >
                    <input type="hidden" name="userId" value={member.userId} />
                    <button type="submit" aria-label={`Transferir propiedad a ${member.username}`} className={secondaryButton}>
                      Hacer propietario
                    </button>
                  </ActionForm>
                  <ActionForm action={removeMemberAction} confirmMessage={`¿Eliminar a ${member.username} del grupo?`}>
                    <input type="hidden" name="userId" value={member.userId} />
                    <button type="submit" aria-label={`Eliminar a ${member.username}`} className={dangerButton}>
                      Eliminar
                    </button>
                  </ActionForm>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {group.isOwner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Invitar</h2>
          <ActionForm action={inviteAction} className="flex flex-wrap items-end gap-2">
            <InviteUserInput />
            <button type="submit" className={primaryButton}>
              Invitar
            </button>
          </ActionForm>
          {group.pendingInvitations.length > 0 && (
            <ul aria-label="Invitaciones pendientes" className="flex flex-col divide-y divide-neutral-800">
              {group.pendingInvitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {invitation.inviteeUsername}{" "}
                    <span className="text-sm text-neutral-400">
                      · {invitation.status} · vence a las {formatFestivalTime(invitation.expiresAt)}
                    </span>
                  </span>
                  <ActionForm action={cancelInvitationAction}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <button
                      type="submit"
                      aria-label={`Cancelar invitación a ${invitation.inviteeUsername}`}
                      className={secondaryButton}
                    >
                      Cancelar
                    </button>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-wrap gap-3 border-t border-neutral-800 pt-4">
        {group.isOwner ? (
          <ActionForm
            action={deleteGroupAction}
            confirmMessage="¿Eliminar el grupo? Todos los miembros pierden el acceso y las invitaciones se anulan."
          >
            <button type="submit" className={dangerButton}>
              Eliminar grupo
            </button>
          </ActionForm>
        ) : (
          <ActionForm action={leaveGroupAction} confirmMessage="¿Abandonar el grupo?">
            <button type="submit" className={dangerButton}>
              Abandonar grupo
            </button>
          </ActionForm>
        )}
      </section>
    </>
  );
}
