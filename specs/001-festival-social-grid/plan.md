# Implementation Plan: Festival Social Grid — MVP de grillas personales y grupales

**Branch**: `001-festival-social-grid` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-festival-social-grid/spec.md`

## Summary

Aplicación web autenticada para un único festival argentino por despliegue: grilla del line-up por día (escenarios × horario, forma fija), grilla personal por selección binaria, grupos privados con invitaciones de 15 minutos, vista grupal (grilla con conteos + lista ordenable) y exportación PNG de un día en dos formatos. Next.js resuelve interfaz y backend (Server Components, Route Handlers y Server Actions); PostgreSQL vía Prisma persiste todo; Auth.js maneja Google y las sesiones, y el acceso por nombre de usuario + PIN se implementa a medida para cumplir bloqueo y respuesta uniforme; los PNG se generan en el servidor con Satori + resvg. La autorización se aplica siempre del lado del servidor.

## Technical Context

**Language/Version**: TypeScript (modo estricto) sobre Node.js LTS; Next.js en la versión instalada al crear el proyecto (leer `node_modules/next/dist/docs/` antes de escribir código, según `AGENTS.md`).

**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS, Prisma (ORM y migraciones), Auth.js (proveedor Google + sesiones en base de datos), Satori + resvg (PNG), `@node-rs/argon2` (hash del PIN). `csv-parse` (importador), `zod` (validación de entradas). Zonas horarias con `Intl` nativo, sin librería. Detalle en [research.md](./research.md) §8.

**Storage**: PostgreSQL.

**Testing**: Vitest + React Testing Library (lógica y componentes); integración contra PostgreSQL efímera con Testcontainers; Playwright (flujos en navegador, gestos y grilla). Pruebas de carga: herramienta **PENDIENTE** (decisión del propietario).

**Target Platform**: navegadores móviles y de escritorio actuales; servidor Node.js en Linux. Hosting **PENDIENTE** (Vercel es candidato, no decisión).

**Project Type**: aplicación web full-stack en un único proyecto Next.js.

**Performance Goals**: p95 < 2 s para line-up, grilla personal y vista grupal (RNF-01); p95 < 5 s para exportación PNG (RNF-03); transición de estado temporal visible en ≤ 60 s (RNF-02).

**Constraints**: todo contenido detrás de autenticación; hora autoritativa del servidor con zona `America/Argentina/Buenos_Aires`; TLS ≥ 1.2 (depende del hosting); PIN solo como hash; cero secretos en el repositorio (Constitución V); solo Tailwind para estilos.

**Scale/Scope**: un festival, ≤ 5 escenarios, ~150 shows; grupos ≤ 15 miembros; ~10 usuarios concurrentes en el escenario de medición; español únicamente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento en el plan | Estado |
|---|---|---|
| I. Commits por unidad validada | `tasks.md` se dividirá en unidades de una conducta verificable, un commit Conventional Commit cada una. | ✅ |
| II. Pruebas primero | Cada unidad empieza con la prueba del AC correspondiente (rojo → verde → refactor); la estrategia por capa está en [quickstart.md](./quickstart.md). | ✅ |
| III. Reutilizar pruebas | Suites organizadas por dominio (auth, grupos, grilla, export) para extender pruebas existentes antes de crear nuevas. | ✅ |
| IV. Autorización para acciones destructivas | Migraciones y reimportaciones solo sobre bases efímeras de prueba sin autorización; instalar dependencias, `git push` y despliegues requieren aprobación. | ✅ |
| V. Cero secretos | Credenciales de Google, `AUTH_SECRET` y `DATABASE_URL` solo por variables de entorno; se versiona únicamente `.env.example` sin valores. | ✅ |
| Restricciones (stack, decisiones pendientes) | Next.js + PostgreSQL + Tailwind respetados; ORM, auth, PNG y DB de prueba acordados con el propietario el 2026-10-13; hosting y herramienta de carga quedan pendientes y no se fijan. | ✅ |

**Re-check post-diseño**: sin violaciones. Las decisiones pendientes (hosting y herramienta de carga) no bloquean el diseño, pero sí bloquean las unidades que las usen (RNF-01/03/07).

## Project Structure

### Documentation (this feature)

```text
specs/001-festival-social-grid/
├── plan.md              # Este archivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── http-api.md      # Fase 1: rutas, acciones y reglas de autorización
├── checklists/
└── tasks.md             # Fase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma
└── migrations/
data/
└── lineup.csv                 # CSV versionado del festival
config/
└── festival.ts                # metadatos del festival (sin secretos)
scripts/
└── import-lineup.ts           # importador ejecutado por desarrollo
src/
├── app/
│   ├── (auth)/login/          # Google + usuario/PIN, elección de nombre
│   ├── (app)/grilla/[dia]/    # grilla del día + grilla personal
│   ├── (app)/grupo/           # gestión del grupo, invitaciones, vista grupal
│   ├── (app)/perfil/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── auth/pin/          # login/registro por PIN
│       ├── time/              # instante UTC autoritativo
│       └── export/            # generación de PNG
├── domain/                    # lógica pura: tiempo, layout de grilla, superposición, coincidencias, validación
├── server/                    # acceso a datos, autorización, servicios (grupos, invitaciones, auth PIN)
├── components/grid/           # grilla compartida por app y PNG
└── export/                    # plantillas Satori de la grilla
tests/
├── unit/                      # Vitest: domain/
├── integration/               # Vitest + Testcontainers: server/, rutas, importador, permisos
└── e2e/                       # Playwright
```

**Structure Decision**: un único proyecto Next.js. La lógica pura de dominio (`src/domain/`) se separa del acceso a datos (`src/server/`) para probarla rápido con Vitest y reutilizar el cálculo de layout de la grilla tanto en la interfaz como en el PNG (consistencia app ↔ exportación, FR-033/FR-072).

## Complexity Tracking

Sin violaciones de la constitución que justificar.
