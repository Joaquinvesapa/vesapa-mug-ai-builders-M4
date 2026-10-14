---

description: "Task list for Festival Social Grid MVP"
---

# Tasks: Festival Social Grid — MVP de grillas personales y grupales

**Input**: Design documents from `/specs/001-festival-social-grid/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/http-api.md, quickstart.md

**Tests**: OBLIGATORIAS. La constitución (Principio II) exige pruebas primero: cada tarea de prueba se escribe antes de su implementación y debe fallar por la razón esperada. Antes de crear una prueba, extender una existente si cubre la misma conducta (Principio III).

**Commits**: una unidad = prueba(s) + implementación de una conducta verificable = un commit Conventional Commit (Principio I). Las tareas de prueba e implementación consecutivas de la misma conducta forman una unidad.

**Organization**: tareas agrupadas por historia de usuario (spec.md) para implementarlas y probarlas en forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario (US1…US8)
- **BLOQUEADA**: depende de una decisión pendiente del propietario; no se inicia hasta resolverla

## Path Conventions

Proyecto único Next.js en la raíz: `src/`, `prisma/`, `scripts/`, `config/`, `data/`, `tests/{unit,integration,e2e}/` (ver plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicializar el proyecto. Instalar dependencias requiere autorización del propietario (Constitución IV).

- [ ] T001 Crear proyecto Next.js (App Router, TypeScript estricto, Tailwind CSS) en la raíz y leer `node_modules/next/dist/docs/` para fijar convenciones de la versión instalada; registrar hallazgos en `specs/001-festival-social-grid/research.md`
- [ ] T002 Instalar dependencias acordadas: `prisma`, `@prisma/client`, `next-auth` (Auth.js) + `@auth/prisma-adapter`, `satori`, `@resvg/resvg-js`, `@node-rs/argon2`, `csv-parse`, `zod`; y de prueba: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@testcontainers/postgresql`, `@playwright/test` en `package.json`
- [ ] T003 [P] Configurar Vitest con proyectos `unit` (jsdom) e `integration` (node) en `vitest.config.ts` y scripts `test:unit`, `test:integration`, `test:e2e`, `lint`, `typecheck` en `package.json`
- [ ] T004 [P] Configurar Playwright con perfiles móvil (375 px de ancho) y escritorio en Chromium, WebKit y Firefox (FR-084) en `playwright.config.ts`
- [ ] T005 [P] Crear `.env.example` sin valores con `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` y asegurar `.env*` (salvo `.env.example`) en `.gitignore`
- [ ] T006 [P] Agregar fuente libre versionada para la UI y el PNG en `public/fonts/` y documentar su licencia en `public/fonts/LICENSE`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura que todas las historias necesitan.

**⚠️ CRITICAL**: ninguna historia empieza antes de terminar esta fase.

- [ ] T007 Crear helper de integración que levanta PostgreSQL con Testcontainers, aplica migraciones de Prisma y limpia tablas entre pruebas en `tests/integration/setup/db.ts`
- [ ] T008 Definir esquema Prisma completo según data-model.md en `prisma/schema.prisma`: `Stage` (`position` int 0–4, `name` único), `Show` (`id` del CSV, `endsAt > startsAt`, índice `(festivalDay, stageId, startsAt)`), `User` (`username` 3–30 nullable hasta primer acceso, `usernameKey` único, `pinHash` nullable, `failedAttempts` default 0, `lockedUntil` nullable, enums `avatarShape` (circle|square|triangle|diamond|star|hexagon) y `avatarColor` violeta|fucsia|rosa|naranja|ámbar|esmeralda|celeste|azul), `Selection` PK `(userId, showId)`, `Group` (`name` 1–40, `ownerId`), `Membership` (`userId` único, cascade por grupo), `Invitation` (`status` PENDING|ACCEPTED|REJECTED|CANCELLED, cascade por grupo) y tablas de Auth.js (`Account`, `Session`); generar migración inicial en `prisma/migrations/`
- [ ] T009 [P] Configurar metadatos del festival único (nombre, país `AR`, zona `America/Argentina/Buenos_Aires`, días ordenados) en `config/festival.ts`
- [ ] T010 [P] Prueba unitaria de conversión hora local del festival ↔ instante UTC (UTC−3 fijo, shows después de medianoche) en `tests/unit/domain/time.test.ts`
- [ ] T011 [P] Implementar conversión y formateo con `Intl` nativo en `src/domain/time.ts` (cierra T010)
- [ ] T012 [P] Cliente Prisma singleton en `src/server/db.ts`
- [ ] T013 Configurar Auth.js con proveedor Google, adaptador Prisma y estrategia de sesión en base de datos en `src/server/auth.ts` y `src/app/api/auth/[...nextauth]/route.ts`
- [ ] T014 Prueba de integración del guard de sesión: sin sesión, páginas redirigen a `/login` y APIs responden 401 sin contenido; con sesión sin `username`, redirige a `/bienvenida` en `tests/integration/auth/guard.test.ts`
- [ ] T015 Implementar `requireUser()` / `requireUserWithUsername()` y protección de rutas en `src/server/session.ts` y `src/proxy.ts` (o el equivalente que indique la documentación de la versión instalada) (cierra T014)
- [ ] T016 [P] Prueba de integración de `GET /api/time` (requiere sesión, devuelve `{ now }` ISO UTC) en `tests/integration/time.test.ts`
- [ ] T017 [P] Implementar `GET /api/time` en `src/app/api/time/route.ts` (cierra T016)
- [ ] T018 [P] Paleta fija de 5 colores de escenario y 8 de avatar como tokens Tailwind en `src/domain/palettes.ts`

**Checkpoint**: base lista; las historias pueden empezar.

---

## Phase 3: User Story 8 - Aprovisionar el festival (Priority: P1, operativa)

**Goal**: desarrollo importa el line-up desde el CSV versionado con validación total previa.

**Independent Test**: importar un CSV válido y otros inválidos y verificar los shows en la base (AC-01, AC-03, AC-109).

### Tests for User Story 8 ⚠️

- [ ] T019 [P] [US8] Prueba unitaria del validador del CSV: campos requeridos (id, artista, descripción, día, escenario, inicio, finalización), `endsAt > startsAt`, id duplicado, día no configurado, más de 5 escenarios, orden de escenarios por aparición en `tests/unit/domain/lineup-validation.test.ts`
- [ ] T020 [P] [US8] Prueba de integración del importador: CSV válido carga 1 festival y todos los shows (AC-01); show sin escenario o 6 escenarios ⇒ falla y 0 shows de esa ejecución (AC-03, AC-109); reimportación conserva ids; si faltan shows se rechaza sin cambios y los lista; con flag de eliminación los borra junto con sus selecciones (FR-006) en `tests/integration/import/import-lineup.test.ts`

### Implementation for User Story 8

- [ ] T021 [US8] Implementar validación con `zod` y `csv-parse` en `src/domain/lineup-validation.ts` (cierra T019)
- [ ] T022 [US8] Implementar importador transaccional (upsert por id; faltantes ⇒ rechazo con listado; eliminación con selecciones solo con flag explícito) en `scripts/import-lineup.ts` y script `import:lineup` en `package.json` (cierra T020)
- [ ] T023 [P] [US8] Crear CSV de fixture válido e inválidos en `tests/fixtures/lineup/` y CSV versionado del festival en `data/lineup.csv` (parte de la unidad de T020)

**Checkpoint**: hay line-up importable y probado.

---

## Phase 4: User Story 1 - Acceder con una cuenta propia (Priority: P1) 🎯 MVP

**Goal**: acceso con Google o usuario + PIN, con bloqueo y respuesta uniforme; nada visible sin sesión.

**Independent Test**: crear cuenta con PIN, cerrar sesión, reingresar y verificar denegación sin sesión.

### Tests for User Story 1 ⚠️

> Las e2e se escriben primero y quedan en rojo hasta completar la UI; se commitean con la última tarea que las pone en verde.

- [ ] T024 [P] [US1] Prueba unitaria de validación de PIN (`^\d{6}$`: rechaza 5, 7 dígitos y letras; AC-06) y de nombre de usuario (`^[A-Za-z0-9._]{3,30}$`: 3 y 30 aceptan, 2 y 31 rechazan, espacios/acentos/ñ rechazan; AC-12, AC-13, FR-016) en `tests/unit/domain/credentials.test.ts`
- [ ] T025 [P] [US1] Prueba de integración de `POST /api/auth/pin`: alta de usuario nuevo con sesión (AC-07), login case-insensitive "aNA"→"Ana" sin duplicar (AC-08), PIN incorrecto (AC-09), PIN solo como hash (AC-20), cuenta Google rechazada (AC-21) en `tests/integration/auth/pin-login.test.ts`
- [ ] T026 [P] [US1] Prueba de integración de bloqueo con reloj inyectado: 4 fallos + correcto entra (AC-15), 5 fallos + correcto antes de 15:00 rechaza (AC-16), a 15:00 entra (AC-17), reinicio del contador (AC-18), respuesta idéntica PIN incorrecto vs bloqueado (AC-19) en `tests/integration/auth/pin-lockout.test.ts`
- [ ] T027 [P] [US1] Prueba de integración de cierre de sesión: tras `signOut` la sesión se elimina y el contenido se deniega (AC-10) en `tests/integration/auth/sign-out.test.ts`
- [ ] T028 [P] [US1] Prueba de integración de login Google exitoso con proveedor simulado (AC-05); falla o cancelación vuelve a `/login` con mensaje y sin crear cuenta (FR-096); primer acceso Google: sin `username` no accede hasta fijarlo; nombre duplicado case-insensitive rechazado (AC-11, AC-14) en `tests/integration/auth/google-first-access.test.ts`
- [ ] T029 [P] [US1] Prueba de integración de denegación sin sesión para line-up, detalle, grilla, grupo, invitaciones y exportación (AC-98, AC-99, AC-100) en `tests/integration/access/unauthenticated.test.ts`
- [ ] T030 [US1] Prueba e2e del flujo de acceso por PIN (alta, cierre, reingreso; sin opciones de email, FR-018; sesión con vencimiento de 30 días renovable, FR-083) en `tests/e2e/auth.spec.ts`

### Implementation for User Story 1

- [ ] T031 [US1] Implementar validaciones de credenciales en `src/domain/credentials.ts` (cierra T024)
- [ ] T032 [US1] Implementar servicio de login/alta por PIN con Argon2id, bloqueo atómico y respuesta uniforme `401 {"error":"invalid_credentials"}` en `src/server/auth/pin-service.ts` (parte de la unidad de T025, T026)
- [ ] T033 [US1] Implementar `POST /api/auth/pin` que crea la fila `Session` y la cookie de Auth.js en `src/app/api/auth/pin/route.ts` (cierra T025, T026)
- [ ] T034 [US1] Implementar acción `setUsername` y página `/bienvenida` en `src/app/(auth)/bienvenida/page.tsx` y `src/server/actions/username.ts` (cierra T028)
- [ ] T035 [US1] Implementar página `/login` (Google + usuario/PIN, sin opción de email; FR-018) en `src/app/(auth)/login/page.tsx` (parte de la unidad de T030)
- [ ] T036 [US1] Implementar acción `signOut` y botón de cierre en el layout autenticado en `src/app/(app)/layout.tsx` (cierra T027, T030)

**Checkpoint**: acceso funcional y protegido.

---

## Phase 5: User Story 2 - Consultar el line-up como grilla del día (Priority: P1)

**Goal**: grilla de forma fija por día con colores por escenario y detalle por presión prolongada.

**Independent Test**: recorrer cada día y verificar posiciones, alturas, colores, scroll en 375 px y detalle.

### Tests for User Story 2 ⚠️

- [ ] T037 [P] [US2] Prueba unitaria del layout de grilla: columnas por orden de aparición, eje desde primer inicio a último final, alturas proporcionales a la duración según `MINUTE_HEIGHT_PX`, 18:00–19:00 mide el doble que 18:00–18:30 (AC-34), shows posteriores a medianoche al final del eje (AC-107), regla de texto (ocultar horario, luego truncar con "…") en `tests/unit/domain/grid-layout.test.ts`
- [ ] T038 [P] [US2] Prueba de integración de consulta del line-up por día: cada show aparece una vez en su día (AC-31, AC-32, AC-04) en `tests/integration/lineup/lineup-query.test.ts`
- [ ] T039 [P] [US2] Prueba de componente de la grilla: 5 columnas con color distinto en encabezado y bloques (AC-33) en `tests/unit/components/grid.test.tsx`
- [ ] T040 [P] [US2] Prueba e2e: en 375 px conserva 5 columnas y se desplaza en ambos ejes (AC-105, AC-106); mantener presionado ≥ 500 ms abre el detalle sin cambiar la selección y desplazar no selecciona (AC-35); día inicial según fecha del festival (FR-091); día sin shows, esqueleto de carga y error con "Reintentar" (FR-090); con menos de 5 escenarios las columnas conservan ancho y se alinean a la izquierda (FR-097) en `tests/e2e/grid.spec.ts`

### Implementation for User Story 2

- [ ] T041 [US2] Implementar cálculo de layout compartido app/PNG en `src/domain/grid-layout.ts` (cierra T037)
- [ ] T042 [US2] Implementar consultas de escenarios, shows por día y detalle en `src/server/lineup.ts` (cierra T038)
- [ ] T043 [US2] Implementar componente de grilla (contenedor con scroll en dos ejes, encabezados y eje horario sticky, bloques posicionados) en `src/components/grid/Grid.tsx` y `src/components/grid/ShowBlock.tsx` (cierra T039)
- [ ] T044 [US2] Implementar gestos con pointer events (toque, presión ≥ 500 ms, movimiento > 10 px) en `src/components/grid/useBlockGestures.ts` (parte de la unidad de T040)
- [ ] T045 [US2] Implementar detalle del show (artista, descripción, día, escenario, inicio, finalización) en `src/components/grid/ShowDetail.tsx` y `GET /api/shows/[id]` en `src/app/api/shows/[id]/route.ts` (parte de la unidad de T040)
- [ ] T046 [US2] Implementar página `/grilla/[dia]` con selector de día y sin elementos de elección de festival (AC-02) en `src/app/(app)/grilla/[dia]/page.tsx` (cierra T040)

**Checkpoint**: line-up navegable.

---

## Phase 6: User Story 3 - Armar la grilla personal (Priority: P1)

**Goal**: selección binaria, resaltado, advertencia de superposición y estados temporales.

**Independent Test**: seleccionar/deseleccionar shows solapados y verificar resaltado, advertencia y estados en los límites.

### Tests for User Story 3 ⚠️

- [ ] T047 [P] [US3] Prueba unitaria de superposición: solapados advierten nombrando ambos (AC-41); contiguos no (AC-42) en `tests/unit/domain/overlap.test.ts`
- [ ] T048 [P] [US3] Prueba unitaria de estado temporal con ms exactos: −1 ms próximo, inicio en vivo, final −1 ms en vivo, final finalizado (AC-80…AC-83); usa offset del servidor e ignora hora del dispositivo (AC-84) en `tests/unit/domain/show-status.test.ts`
- [ ] T049 [P] [US3] Prueba de integración de selección: agregar/quitar idempotente, solapados se conservan (AC-43), no afecta selecciones ajenas (AC-38, AC-39), A no lee la grilla de B (AC-101) en `tests/integration/selection/selection.test.ts`
- [ ] T050 [P] [US3] Prueba e2e: tocar alterna y resalta (AC-36, AC-38), agregar/quitar desde el detalle (AC-37, AC-39), exactamente 2 bloques resaltados (AC-40), estado cambia sin recarga dentro de 60 s con reloj simulado (AC-85, AC-86); aviso de superposición sobre la grilla del día e ícono ⚠ en los bloques (FR-092) en `tests/e2e/personal-grid.spec.ts`

### Implementation for User Story 3

- [ ] T051 [US3] Implementar detección de superposición en `src/domain/overlap.ts` (cierra T047)
- [ ] T052 [US3] Implementar estado temporal y hook de reloj con offset (recalcula cada 15 s, resincroniza cada 5 min) en `src/domain/show-status.ts` y `src/components/grid/useServerClock.ts` (cierra T048)
- [ ] T053 [US3] Implementar acciones `toggleSelection` / `setSelection` sobre la sesión en `src/server/actions/selection.ts` (cierra T049)
- [ ] T054 [US3] Integrar selección optimista, resaltado, advertencias y estados en la grilla en `src/components/grid/Grid.tsx` y `src/components/grid/OverlapWarning.tsx` (cierra T050)

**Checkpoint**: MVP personal completo (US8 + US1 + US2 + US3).

---

## Phase 7: User Story 4 - Crear y gestionar un grupo privado (Priority: P2)

**Goal**: grupos de ≤ 15 con invitaciones de 15 minutos, cancelables por el propietario.

**Independent Test**: crear, invitar, aceptar, rechazar, cancelar, vencer, transferir, eliminar miembros y grupo, con casos permitidos y denegados.

### Tests for User Story 4 ⚠️

> Las e2e se escriben primero y quedan en rojo hasta completar la UI; se commitean con la última tarea que las pone en verde.

- [ ] T055 [P] [US4] Prueba de integración de ciclo de vida del grupo: crear (AC-44), persona con grupo no crea otro (AC-47), renombrar (AC-48), transferir (AC-64), propietario no abandona aunque esté solo (AC-66, FR-050), miembro abandona y pierde acceso (AC-61), eliminar miembro (AC-62), eliminar grupo borra invitaciones vigentes (AC-67, FR-056) en `tests/integration/groups/group-lifecycle.test.ts`
- [ ] T056 [P] [US4] Prueba de integración de invitaciones con reloj inyectado: invitar y ver (AC-50, AC-54), usuario con grupo rechazado (AC-53), 14:59 acepta y 15:00 rechaza (AC-55, AC-56, AC-59), rechazar (AC-60), cupo con vigentes y vencidas (AC-45, AC-46, AC-57, AC-58), cancelar libera cupo y desaparece para el destinatario (FR-057, AC-111), invitación duplicada rechazada, invitaciones vigentes de varios grupos permitidas y al aceptar una las demás quedan invalidadas y liberan cupo (FR-053) en `tests/integration/groups/invitations.test.ts`
- [ ] T057 [P] [US4] Prueba de integración de permisos: no propietario no renombra, invita, cancela, elimina miembros, transfiere ni elimina (AC-49, AC-52, AC-63, AC-65, AC-68); ajeno no lee ni modifica (AC-102); B no acepta/rechaza/lee invitación de A (AC-69, AC-103); propietario sí ve las suyas; no propietario no cancela (AC-112) en `tests/integration/groups/group-authorization.test.ts`
- [ ] T058 [P] [US4] Prueba de integración de concurrencia: dos aceptaciones simultáneas con un solo lugar ⇒ entra una sola en `tests/integration/groups/group-concurrency.test.ts`
- [ ] T059 [US4] Prueba e2e del flujo crear → invitar → aceptar en `tests/e2e/groups.spec.ts`

### Implementation for User Story 4

- [ ] T060 [US4] Implementar servicio de grupos (crear, renombrar 1–40 caracteres, transferir, abandonar, eliminar miembro, eliminar grupo) con bloqueo `SELECT … FOR UPDATE` en `src/server/groups/group-service.ts` (cierra T055)
- [ ] T061 [US4] Implementar servicio de invitaciones (crear, aceptar, rechazar, cancelar; vigencia derivada `PENDING && now < createdAt + 15 min`; cupo miembros + vigentes ≤ 15) en `src/server/groups/invitation-service.ts` (cierra T056, T058)
- [ ] T062 [US4] Implementar acciones de servidor del contrato (`createGroup`, `renameGroup`, `invite`, `cancelInvitation`, `acceptInvitation`, `rejectInvitation`, `leaveGroup`, `removeMember`, `transferOwnership`, `deleteGroup`) en `src/server/actions/groups.ts` (cierra T057)
- [ ] T063 [US4] Implementar página `/grupo` (miembros, gestión, invitaciones vigentes solo para propietario, invitar por nombre sin email — AC-51) en `src/app/(app)/grupo/page.tsx` (parte de la unidad de T059)
- [ ] T064 [US4] Implementar página `/invitaciones` con las vigentes recibidas en `src/app/(app)/invitaciones/page.tsx` (cierra T059)

**Checkpoint**: grupos funcionales.

---

## Phase 8: User Story 5 - Ver coincidencias del grupo (Priority: P2)

**Goal**: grilla del día con conteos más pestaña de lista ordenable y filtrable.

**Independent Test**: con selecciones conocidas, verificar conteos, nombres, marcas, orden, filtro y denegación.

### Tests for User Story 5 ⚠️

- [ ] T065 [P] [US5] Prueba unitaria de coincidencias y orden: conteo (AC-70), nombres solo con conteo ≥ 2 (AC-71, AC-72), marca de coincidencia (AC-73, AC-74), orden por horario (AC-75) y por cantidad con desempate por inicio y artista (AC-76), filtro ≥ 2 (AC-77) en `tests/unit/domain/group-matches.test.ts`
- [ ] T066 [P] [US5] Prueba de integración de `GET /api/group/view`: refleja cambios al consultar (AC-78), nunca envía nombres con conteo < 2, ajeno recibe 404 sin conteos ni nombres (AC-79); persona removida con la vista abierta es llevada a `/grupo` con aviso (FR-094); vista sin selecciones muestra estado vacío (FR-090) en `tests/integration/groups/group-view.test.ts`
- [ ] T067 [P] [US5] Prueba e2e: grilla grupal con conteos y pestaña de lista con orden y filtro en `tests/e2e/group-view.spec.ts`

### Implementation for User Story 5

- [ ] T068 [US5] Implementar agregación y orden/filtro en `src/domain/group-matches.ts` (cierra T065)
- [ ] T069 [US5] Implementar consulta agregada y `GET /api/group/view` en `src/server/groups/group-view.ts` y `src/app/api/group/view/route.ts` (cierra T066)
- [ ] T070 [US5] Implementar página `/grupo/vista/[dia]` (grilla con conteos + pestaña de lista, botón Actualizar) en `src/app/(app)/grupo/vista/[dia]/page.tsx` y `src/components/group/GroupList.tsx` (cierra T067)

**Checkpoint**: valor social completo.

---

## Phase 9: User Story 6 - Exportar la grilla como imagen (Priority: P3)

**Goal**: PNG del día en 1080 × 1920 o 1080 × 1350, personal o grupal.

**Independent Test**: exportar cada combinación y verificar dimensiones, contenido, nombres y acceso.

### Tests for User Story 6 ⚠️

- [ ] T071 [P] [US6] Prueba unitaria de escala del PNG: grilla completa dentro del formato sin deformar (AC-108) y fuentes ≥ 20 px artista / ≥ 16 px horario con omisión y truncado (AC-110) en `tests/unit/export/export-layout.test.ts`
- [ ] T072 [P] [US6] Prueba de integración de `GET /api/export`: dimensiones exactas (AC-87, AC-88, AC-90), 8 shows con 2 resaltados (AC-89), sin estados temporales (FR-093), nombre de archivo y encabezado con festival, día y grupo (FR-070), bloques dentro del lienzo y aspecto conservado ±1 px (FR-071), 40 shows incluidos (AC-95), conteo grupal (AC-91), nombres solo con opción y conteo ≥ 2 (AC-92, AC-93, AC-94), `Cache-Control: private, no-store`, ajeno a G denegado (AC-104) en `tests/integration/export/export.test.ts`

### Implementation for User Story 6

- [ ] T073 [US6] Implementar cálculo de escala y tamaños mínimos de fuente sobre `grid-layout` en `src/export/export-layout.ts` (cierra T071)
- [ ] T074 [US6] Implementar plantilla Satori de la grilla (personal y grupal) en `src/export/GridImage.tsx` (parte de la unidad de T072)
- [ ] T075 [US6] Implementar `GET /api/export` (validación con zod, autorización, Satori → resvg) en `src/app/api/export/route.ts` (cierra T072)
- [ ] T076 [US6] Implementar diálogo de exportación (día, formato, opción explícita de nombres) en `src/components/export/ExportDialog.tsx`

**Checkpoint**: exportación lista.

---

## Phase 10: User Story 7 - Gestionar el perfil y buscar personas (Priority: P3)

**Goal**: perfil propio editable, avatar de formas y colores, búsqueda pública mínima.

**Independent Test**: editar el perfil, buscar usuarios y verificar que no se acceda a perfiles ajenos.

### Tests for User Story 7 ⚠️

- [ ] T077 [P] [US7] Prueba de integración de perfil: leer propio (AC-23), cambiar nombre (AC-24) y que invitaciones y vista grupal muestren el nombre nuevo (FR-095), forma y color de avatar (AC-25, AC-26), cuenta nueva con forma y color asignados al azar dentro de los sets (FR-021), no leer ni modificar el de otra persona (AC-29, AC-30) en `tests/integration/profile/profile.test.ts`
- [ ] T078 [P] [US7] Prueba de integración de `GET /api/users?q=`: devuelve coincidencias por prefijo sin distinguir mayúsculas, `q` < 2 caracteres ⇒ 400, máximo 10, excluye a quien busca (AC-27, FR-022) con exactamente 2 campos `username` y `avatar` (AC-28) en `tests/integration/profile/user-search.test.ts`

### Implementation for User Story 7

- [ ] T079 [US7] Implementar acción `updateProfile` y página `/perfil` en `src/server/actions/profile.ts` y `src/app/(app)/perfil/page.tsx` (cierra T077)
- [ ] T080 [P] [US7] Implementar componente de avatar con las 6 formas (círculo, cuadrado, triángulo, rombo, estrella, hexágono) en `src/components/avatar/Avatar.tsx` (parte de la unidad de T077)
- [ ] T081 [US7] Implementar `GET /api/users` en `src/app/api/users/route.ts` y buscador en el formulario de invitación de `src/app/(app)/grupo/page.tsx` (cierra T078)

**Checkpoint**: todas las historias completas.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T082 [P] Prueba de integración transversal de privacidad: barrido de todas las rutas con persona no autenticada y con persona ajena, 0 exposiciones (RNF-04, RNF-05) en `tests/integration/access/privacy-sweep.test.ts`
- [ ] T083 [P] Fixture de rendimiento: 150 shows, grupo de 15 con 30 selecciones por miembro en `tests/fixtures/perf/seed.ts`
- [ ] T084 **BLOQUEADA** (herramienta de carga pendiente) Prueba de carga de line-up, grilla personal y vista grupal con p95 < 2 s (RNF-01, AC-97) en `tests/load/`
- [ ] T085 **BLOQUEADA** (herramienta de carga pendiente) Prueba de carga de exportación con p95 < 5 s (RNF-03, AC-96) en `tests/load/`
- [ ] T086 **BLOQUEADA** (hosting pendiente) Verificar TLS ≥ 1.2 y rechazo de 1.1 en el endpoint público (RNF-07, AC-22)
- [ ] T087 Realizar prueba de uso manual con 5 personas (encontrar show, agregarlo, ver coincidencia; éxito si ≥ 4 lo logran sin ayuda en < 3 min) y registrar resultados en `specs/001-festival-social-grid/usability-results.md` (SC-008)
- [ ] T088 [P] Prueba e2e de accesibilidad básica: contraste WCAG AA, foco visible y opción "Ver detalle" en bloques (FR-085) en `tests/e2e/accessibility.spec.ts`
- [ ] T089 Ejecutar la validación de `specs/001-festival-social-grid/quickstart.md` y registrar resultados

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → historias.
- **US8** (import) habilita datos para US2, US3, US5, US6.
- **US1** (acceso) es requisito de todas las demás historias de usuario.
- **US2** → **US3** (la selección vive en la grilla).
- **US4** → **US5** (la vista grupal necesita grupos).
- **US6** depende de US3; su parte grupal, de US5.
- **US7** es independiente tras US1; T081 se integra con la página de US4.
- **Polish (11)** al final; T084–T086 bloqueadas por decisiones del propietario.

### Within Each User Story

- Pruebas primero y en rojo; luego dominio puro → servicios → acciones/rutas → UI → e2e.
- Unidad = prueba(s) + tareas marcadas "(cierra T0xx)" y "(parte de la unidad de T0xx)" = 1 commit. Un commit por conducta terminada.

### Parallel Opportunities

- Setup: T003–T006.
- Foundational: T009–T012, T016–T018.
- Dentro de cada historia, todas las pruebas marcadas [P].
- Tras US1: US4 y US7 pueden avanzar en paralelo con US2/US3.

---

## Parallel Example: User Story 4

```text
T055 group-lifecycle.test.ts
T056 invitations.test.ts
T057 group-authorization.test.ts
T058 group-concurrency.test.ts
T059 groups.spec.ts (e2e)
```

---

## Implementation Strategy

### MVP First

1. Setup + Foundational.
2. US8 → US1 → US2 → US3: grilla personal completa. **Parar y validar.**

### Incremental Delivery

3. US4 → US5: valor social.
4. US6: exportación.
5. US7: perfil y búsqueda.
6. Polish; desbloquear T084–T086 cuando el propietario decida herramienta de carga y hosting.
