# Contrato de interfaces — Festival Social Grid

Todas las rutas y acciones requieren sesión salvo las de autenticación. Sin sesión: páginas redirigen a `/login`; APIs responden `401` sin cuerpo con contenido. Sin permiso sobre el recurso: `404` (no revela existencia). Toda la autorización se evalúa en el servidor a partir de la sesión, nunca de ids enviados por el cliente para identificar a la persona.

## Autenticación

| Interfaz | Entrada | Salida |
|---|---|---|
| `POST /api/auth/pin` | `{ username, pin }` (`pin` = `^\d{6}$`) | `200` + cookie de sesión (login o alta si el nombre no existe); `400 {"error":"invalid_format"}` si el formato es inválido; `401 {"error":"invalid_credentials"}` idéntico para PIN incorrecto, usuario bloqueado o cuenta Google |
| Auth.js `/api/auth/*` | flujo Google | sesión; si falta `username`, redirige a `/bienvenida` |
| Acción `setUsername(username)` | 3–30 caracteres | `ok` / `username_taken` / `invalid_username` |
| Acción `signOut()` | — | elimina la sesión en DB |
| `GET /api/time` | — | `{ "now": "<ISO-8601 UTC>" }` |

## Perfil y búsqueda

| Interfaz | Regla | Salida |
|---|---|---|
| Página `/perfil` | solo la propia persona | perfil completo |
| Acción `updateProfile({ username?, avatarShape?, avatarColor? })` | siempre sobre la sesión | perfil actualizado o error de validación |
| `GET /api/users?q=` | autenticado; `q` ≥ 2 caracteres (si no, `400`); prefijo sin distinguir mayúsculas; máx. 10; excluye a quien busca | `[{ "username", "avatar": { "shape", "color" } }]` — exactamente esos 2 campos |

No existe ruta para leer el perfil de otra persona (FR-023).

## Line-up y grilla personal

| Interfaz | Regla | Salida |
|---|---|---|
| Página `/grilla/[dia]` | autenticado | escenarios, shows del día, selecciones propias, superposiciones, `serverNow` |
| `GET /api/shows/[id]` | autenticado | detalle completo del show |
| Acción `toggleSelection(showId)` / `setSelection(showId, selected)` | solo selecciones propias | estado resultante |

## Grupo e invitaciones

| Acción | Quién | Errores |
|---|---|---|
| `createGroup(name)` | sin grupo | `already_in_group`, `invalid_name` |
| `renameGroup(name)` | propietario actual | `forbidden` |
| `invite(username)` | propietario actual | `forbidden`, `user_not_found`, `user_in_group`, `group_full`, `already_invited` |
| `cancelInvitation(id)` | propietario actual | `forbidden`, `not_pending` |
| `acceptInvitation(id)` | destinatario | `not_found`, `expired`, `already_in_group`, `group_full` |
| `rejectInvitation(id)` | destinatario | `not_found`, `expired` |
| `leaveGroup()` | miembro no propietario | `owner_cannot_leave` |
| `removeMember(userId)` | propietario actual | `forbidden`, `not_member` |
| `transferOwnership(userId)` | propietario actual | `forbidden`, `not_member` |
| `deleteGroup()` | propietario actual | `forbidden` |

Páginas: `/grupo` (miembros; invitaciones vigentes visibles solo para el propietario), `/invitaciones` (vigentes recibidas).

## Vista grupal

`GET /grupo/vista/[dia]` (página) y `GET /api/group/view?day=` — solo miembros.

```json
{
  "day": "2026-11-21",
  "shows": [
    { "showId": "s1", "count": 3, "isMatch": true, "usernames": ["ana", "beto", "caro"], "selectedByMe": true },
    { "showId": "s2", "count": 1, "isMatch": false, "usernames": [], "selectedByMe": false }
  ]
}
```

`usernames` siempre vacío si `count < 2`. Orden y filtro de la lista se aplican sobre estos datos.

## Exportación

`GET /api/export?kind=personal|group&day=YYYY-MM-DD&format=1080x1920|1080x1350&names=0|1`

- `200 image/png`, dimensiones exactas, `Cache-Control: private, no-store`.
- `kind=group` exige membresía; `names` se ignora si no es grupal.
- `400` parámetros inválidos; `401` sin sesión; `404` sin grupo.
