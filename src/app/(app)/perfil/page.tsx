import { Suspense } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { ActionForm } from "@/components/group/ActionForm";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { AVATAR_SHAPES, COLOR_LABELS, SHAPE_LABELS } from "@/domain/avatar";
import { AVATAR_COLORS } from "@/domain/palettes";
import type { AvatarColor } from "@/generated/prisma/enums";
import { changeUsernameAction, updateAvatarAction } from "@/server/actions/profile";
import { requirePageUser } from "@/server/page-session";
import { getMyProfile } from "@/server/users";

export default function ProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <Suspense fallback={<p className="text-neutral-400">Cargando el perfil…</p>}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}

async function ProfileContent() {
  const user = await requirePageUser();
  const profile = (await getMyProfile(user.id))!;

  return (
    <>
      <section className="flex items-center gap-4">
        <Avatar shape={profile.avatarShape} color={profile.avatarColor} size={56} />
        <div>
          <p className="text-lg font-bold">{profile.username}</p>
          <p className="text-sm text-neutral-400">
            {profile.accessMethod === "google" ? "Acceso con Google" : "Acceso con nombre de usuario y PIN"}
          </p>
        </div>
      </section>

      <ActionForm action={changeUsernameAction} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span>Nombre de usuario</span>
          <input name="username" required minLength={3} maxLength={30} defaultValue={profile.username ?? ""} className={inputClass} />
        </label>
        <button type="submit" className={secondaryButton}>
          Guardar nombre
        </button>
      </ActionForm>

      <ActionForm action={updateAvatarAction} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-bold">Forma</legend>
          <div className="flex flex-wrap gap-3">
            {AVATAR_SHAPES.map((shape) => (
              <label key={shape} className="flex items-center gap-2 rounded-lg border border-neutral-700 px-2 py-1">
                <input type="radio" name="avatarShape" value={shape} defaultChecked={shape === profile.avatarShape} />
                <Avatar shape={shape} color={profile.avatarColor} size={20} decorative />
                <span>{SHAPE_LABELS[shape]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-bold">Color</legend>
          <div className="flex flex-wrap gap-3">
            {AVATAR_COLORS.map((color) => (
              <label key={color.name} className="flex items-center gap-2 rounded-lg border border-neutral-700 px-2 py-1">
                <input type="radio" name="avatarColor" value={color.name} defaultChecked={color.name === profile.avatarColor} />
                <span aria-hidden="true" className="size-4 rounded-full" style={{ backgroundColor: color.hex }} />
                <span>{COLOR_LABELS[color.name as AvatarColor]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className={`self-start ${primaryButton}`}>
          Guardar avatar
        </button>
      </ActionForm>
    </>
  );
}
