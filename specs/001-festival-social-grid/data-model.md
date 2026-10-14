# Data Model: Festival Social Grid — MVP

Instantes en UTC (`timestamptz`); la presentación usa `America/Argentina/Buenos_Aires`. Identificadores internos: `cuid`/`uuid` salvo que se indique.

## Festival (configuración, no tabla)

Metadatos en `config/festival.ts`: nombre, país (`AR`), zona horaria fija y lista ordenada de días de festival. Uno por despliegue (FR-001, FR-002).

## Stage

| Campo | Tipo | Reglas |
|---|---|---|
| id | string | |
| name | string | único |
| position | int 0–4 | orden de aparición en el CSV; define columna y color (FR-031, FR-032) |

Máximo 5 filas (FR-004). Color = `palette[position]` con paleta fija: violeta, fucsia, ámbar, esmeralda, celeste.

## Show

| Campo | Tipo | Reglas |
|---|---|---|
| id | string | id del CSV, estable entre importaciones (FR-006) |
| artist | string | requerido |
| description | string | requerido |
| festivalDay | date | día de festival del CSV, aunque termine después de medianoche (FR-005) |
| stageId | FK Stage | requerido |
| startsAt | timestamptz | requerido |
| endsAt | timestamptz | requerido, `> startsAt` |

Índice: `(festivalDay, stageId, startsAt)`.

**Importación**: valida todo el CSV (campos requeridos, `endsAt > startsAt`, id único, ≤ 5 escenarios, día dentro de los días configurados) y escribe en una transacción: upsert por id. Si faltan shows existentes, la importación se rechaza sin cambios y los lista; con confirmación explícita (flag de eliminación) se eliminan junto con sus selecciones en la misma transacción (FR-006).

## User

| Campo | Tipo | Reglas |
|---|---|---|
| id | string | |
| username | string? | 3–30 caracteres, `^[A-Za-z0-9._]{3,30}$`; nulo solo hasta completar el primer acceso con Google (FR-015, FR-016) |
| usernameKey | string? | `lower(username)`, **único** |
| pinHash | string? | Argon2id; nulo para cuentas Google (FR-010, FR-012) |
| failedAttempts | int | default 0 |
| lockedUntil | timestamptz? | `now + 15 min` al 5º fallo (FR-013) |
| avatarShape | enum | circle, square, triangle, diamond, star, hexagon; al azar al crear la cuenta |
| avatarColor | enum | violeta, fucsia, rosa, naranja, ámbar, esmeralda, celeste, azul; al azar al crear la cuenta |
| createdAt | timestamptz | |

Tablas de Auth.js: `Account` (Google), `Session` (sesiones en DB), `VerificationToken` (no usada).

## Selection

| Campo | Tipo | Reglas |
|---|---|---|
| userId | FK User | |
| showId | FK Show | |
| createdAt | timestamptz | |

PK `(userId, showId)`: selección binaria e idempotente (FR-040).

## Group

| Campo | Tipo | Reglas |
|---|---|---|
| id | string | |
| name | string | 1–40 caracteres, no único (FR-050) |
| ownerId | FK User | propietario **actual**; debe ser miembro |
| createdAt | timestamptz | |

## Membership

| Campo | Tipo | Reglas |
|---|---|---|
| groupId | FK Group (cascade) | |
| userId | FK User | **único**: una persona, un grupo (FR-050) |
| joinedAt | timestamptz | |

Invariante: `miembros + invitaciones vigentes ≤ 15` (FR-051), verificada con bloqueo de la fila del grupo.

## Invitation

| Campo | Tipo | Reglas |
|---|---|---|
| id | string | |
| groupId | FK Group (cascade) | |
| inviteeId | FK User | |
| createdAt | timestamptz | |
| status | enum | `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED` |

"Vigente" = `status = PENDING` y `now < createdAt + 15 min`; "vencida" se deriva, no se persiste (FR-054).

### Transiciones

```text
PENDING ──aceptar (destinatario, vigente, sin grupo, cupo ok)──▶ ACCEPTED  (+ Membership)
PENDING ──rechazar (destinatario, vigente)─────────────────────▶ REJECTED
PENDING ──cancelar (propietario actual)───────────────────────▶ CANCELLED
PENDING ──el destinatario acepta otra invitación──────────────▶ CANCELLED (misma transacción que la aceptación)
PENDING ──now ≥ createdAt + 15 min─────────────────────────────▶ (vencida, derivado)
grupo eliminado ──▶ invitaciones eliminadas en cascada (desaparecen al instante, FR-056)
```

Reglas: no se crea invitación si el destinatario ya es miembro de un grupo (FR-053). Una invitación vigente duplicada al mismo destinatario desde el mismo grupo se rechaza.

## Reglas de grupo

- Crear: solo sin membresía; crea `Group` + `Membership` del creador como propietario.
- Abandonar: solo no propietarios; el propietario (aunque esté solo) debe transferir o eliminar (FR-050).
- Transferir: el nuevo propietario debe ser miembro.
- Eliminar: borra grupo, membresías e invitaciones en una transacción.

## Exportación (no persistida)

Parámetros por solicitud: `kind` (`personal` | `group`), `day`, `format` (`1080x1920` | `1080x1350`), `includeNames` (solo grupal). Se autoriza y genera en cada solicitud.
