# Research: Festival Social Grid — MVP

Decisiones de stack confirmadas por el propietario el 2026-10-13: Prisma, Auth.js (Google) + PIN propio, Satori + resvg, Testcontainers. Lo demás se marca como propuesta o pendiente.

## 1. Acceso a datos — Prisma

- **Decision**: Prisma como ORM y para migraciones.
- **Rationale**: elegido por el propietario; tipos generados y migraciones versionadas.
- **Consecuencias de diseño**:
  - Unicidad sin distinguir mayúsculas: columna `usernameKey` (minúsculas) con índice único, porque Prisma no ofrece índices funcionales de forma nativa.
  - Cupo de grupo (≤ 15 miembros + invitaciones vigentes) y "un grupo por persona": transacción interactiva que bloquea la fila del grupo con `SELECT … FOR UPDATE` (`$queryRaw`) antes de contar; la unicidad de `Membership.userId` actúa como red de seguridad.
  - Importador: una sola transacción; si la validación falla no se escribe nada (RNF-06).
- **Alternatives considered**: Drizzle (más control de SQL), SQL directo.

## 2. Autenticación — Auth.js + PIN propio

- **Decision**: Auth.js con proveedor Google y adaptador Prisma, **sesiones en base de datos**. El acceso por PIN es un Route Handler propio que valida, aplica bloqueo y, si corresponde, crea una fila `Session` y la cookie de sesión de Auth.js.
- **Rationale**: el proveedor `Credentials` de Auth.js obliga a sesiones JWT, que no permiten invalidar del lado del servidor ni controlar la respuesta uniforme (RNF-12). Con sesiones en DB, cerrar sesión elimina la fila (AC-10).
- **Reglas**:
  - Cuentas Google y PIN separadas: una cuenta con `Account` de Google no tiene `pinHash`; un intento de PIN contra ella responde igual que un PIN incorrecto (AC-21).
  - Bloqueo: `failedAttempts` y `lockedUntil` por usuario; 5 fallos ⇒ `lockedUntil = now + 15 min`; éxito ⇒ contador a 0 (RNF-10/11). Actualización atómica dentro de una transacción.
  - Respuesta uniforme: PIN incorrecto, usuario bloqueado y cuenta Google ⇒ `401` con el mismo cuerpo `{"error":"invalid_credentials"}`. Se ejecuta la verificación de hash también en caso de bloqueo para igualar tiempos.
  - Primer acceso con Google: el usuario queda sin `username`; un guard de servidor redirige a elegir nombre y bloquea todo contenido hasta fijarlo (AC-11).
- **Alternatives considered**: Better Auth; implementación completa propia.

## 3. Generación de PNG — Satori + resvg

- **Decision**: plantilla JSX de la grilla → SVG (Satori) → PNG (resvg) en un Route Handler en runtime Node.
- **Rationale**: elegido por el propietario; tamaños exactos (1080 × 1920 / 1080 × 1350) y sin navegador, acorde con p95 < 5 s.
- **Diseño**:
  - El layout (posiciones y altos de bloques) se calcula en `src/domain/grid-layout` y lo consumen tanto la grilla de la app como la plantilla Satori; así comparten la regla de texto (omitir horario, luego truncar con "…").
  - Satori solo soporta flexbox: los bloques se posicionan con `position: absolute` usando las coordenadas precalculadas.
  - Escala: `factor = min(anchoDisponible / anchoGrilla, altoDisponible / altoGrilla)`, sin deformación (RF-78).
  - Fuentes: archivo de fuente versionado en el repo (licencia libre) cargado en memoria una vez.
  - No se persisten PNG ni hay URL públicas: cada solicitud se autoriza y se genera al vuelo (RNF-04/05).
- **Alternatives considered**: Chromium headless (lento), canvas manual.

## 4. Base de datos de prueba — Testcontainers

- **Decision**: Testcontainers levanta una PostgreSQL efímera por corrida de integración; se aplican migraciones de Prisma al iniciar y se limpia entre pruebas.
- **Rationale**: reproducible en local y CI, sin afectar datos reales (Constitución IV).
- **Requisito**: Docker disponible para el usuario sin `sudo`. Si no lo está, el propietario debe configurarlo (el agente no ejecuta comandos de administrador).

## 5. Tiempo autoritativo y estados

- **Decision**: los horarios del CSV se interpretan en `America/Argentina/Buenos_Aires` y se guardan como instantes UTC (`timestamptz`). El servidor entrega `serverNow` con cada página y en `GET /api/time`; el cliente calcula `offset = serverNow − Date.now()` al recibirlo y evalúa estados con `Date.now() + offset`. Recalcula cada 15 s y resincroniza el offset cada 5 minutos.
- **Rationale**: cumple RNF-02 (≤ 60 s) sin depender de la hora del dispositivo (AC-84); las reglas de borde (`<`, `>=`) viven en una función pura probada con ms exactos (AC-80…83).
- **Alternatives considered**: estados calculados solo en servidor con recarga periódica (más carga); WebSockets (innecesario).

## 6. Grilla en la app

- **Decision**: grilla con columnas de ancho fijo y escala definida por la constante `MINUTE_HEIGHT_PX` en `src/domain/grid-layout.ts` (valor inicial 2, ajustable en diseño visual; las pruebas verifican proporciones, no píxeles) dentro de un contenedor con scroll en ambos ejes; encabezados de escenario y eje horario fijos (sticky). Shows posteriores a medianoche se ubican como minutos > 24 h del día del festival.
- **Gestos**: pointer events. Toque corto ⇒ alternar selección; presión ≥ 500 ms sin moverse más de 10 px ⇒ abrir detalle sin cambiar selección; movimiento > 10 px ⇒ desplazamiento, sin acción (AC-35, AC-105).
- **Selección**: Server Action con actualización optimista; idempotente (agregar dos veces no duplica).
- **Rationale**: forma fija en cualquier pantalla (RF-74) y gestos sin interferencia.

## 7. Vista grupal y actualización

- **Decision**: consulta agregada por día (conteo por show + nombres solo si conteo ≥ 2, calculados en el servidor, nunca enviados al cliente si conteo < 2). Se actualiza al cargar y con un botón "Actualizar" (sin tiempo real, FR-063).
- **Orden por cantidad**: conteo descendente; desempate por inicio ascendente y luego artista (FR-062).

## 8. Propuestas pendientes de confirmación del propietario

| Necesidad | Propuesta | Alternativa |
|---|---|---|
| Hash del PIN | **Confirmado (2026-10-13)**: `@node-rs/argon2` (Argon2id) | `bcrypt` (descartado) |
| Parseo del CSV | **Confirmado (2026-10-13)**: `csv-parse` | parser propio mínimo (descartado) |
| Validación de entradas | **Confirmado (2026-10-13)**: `zod` | validación manual (descartado) |
| Manejo de zonas horarias | **Confirmado (2026-10-13)**: sin dependencia; `Intl` nativo + función propia de conversión con pruebas (Argentina usa UTC−3 fijo, sin horario de verano) | `date-fns-tz` (descartado) |
| Auditoría de accesibilidad (FR-085) | **Confirmado (2026-10-14)**: `@axe-core/playwright` | contraste calculado a mano (descartado) |
| Herramienta de pruebas de carga (RNF-01/03) | **Confirmado (2026-10-14)**: k6 `grafana/k6:2.3.0` en Docker, contra un stack aislado con app (1,5 CPU, 3 GB) y base (0,5 CPU, 1 GB) dentro del presupuesto de 2 vCPU y 4 GB | autocannon, script propio en Node (descartados) |
| Hosting / TLS (RNF-07) | **PENDIENTE** (Vercel candidato) | — |

Hosting e integración continua quedan diferidos por decisión del propietario (2026-10-14) mientras el proyecto está en desarrollo; las unidades que dependan de ellos quedan bloqueadas hasta su decisión.

## 9. Convenciones de Next.js 16.4 (T001, leídas en `node_modules/next/dist/docs/`)

Versiones instaladas el 2026-10-14: Next 16.4.0, React 19.3.0, Tailwind 4, TypeScript 5.9, Node 24. Dependencias fijadas en versión exacta: `next-auth@5.0.0-beta.32` (Auth.js v5 sigue en beta; decisión del propietario), `@auth/prisma-adapter@2.11.3`, `prisma` y `@prisma/client@7.10.0` (el tag `latest` de `prisma` apunta a una RC 8.x; se descartó), `satori@0.56.1`, `@resvg/resvg-js@2.6.2`, `@node-rs/argon2@2.2.2`, `csv-parse@7.0.3`, `zod@4.6.7`, `vitest@5.0.4`, `@testcontainers/postgresql@12.2.1`, `@playwright/test@1.64.0`. `@types/node` subió a `^24` porque Vitest 5 exige ≥ 22.12.

- **Cache Components activo por defecto** (`cacheComponents: true` en `next.config.ts`). Leer `cookies()`/la sesión fuera de un `<Suspense>` es error de build. Toda lectura de sesión (Auth.js `auth()`) va en un componente dentro de un límite `<Suspense>`, nunca en el nivel superior de un layout. Los datos derivados de la sesión se cachean pasando el `userId` a funciones con `'use cache'` o con `'use cache: private'` (guía `02-guides/authentication-with-cache-components.md`).
- **Middleware se llama Proxy**: archivo `src/proxy.ts` con `export function proxy(request)`; corre en runtime Node; necesita `matcher` que excluya `_next/static`, `_next/image` y `public`. Solo sirve para chequeos optimistas (redirigir sin cookie de sesión); **la autorización real va en cada Server Function, Route Handler y en el Data Access Layer** (`src/server/`), porque un cambio de matcher puede dejar acciones sin cubrir.
- **Server Functions** se invocan como POST a la ruta donde se usan: cada acción vuelve a verificar sesión y permisos.
- **Vitest no soporta Server Components `async`**: se prueban con Playwright (coincide con la estrategia del plan). Vite 8 resuelve los alias de `tsconfig` sin plugin extra.
- **Scripts de instalación de npm 11**: quedan sin aprobar (`@prisma/engines`, `prisma`, `esbuild`, `unrs-resolver`, `protobufjs`, `ssh2`, `cpu-features`); Prisma 7 usa el compilador WASM y todas las herramientas funcionan sin ellos. Se aprueban solo si una tarea lo requiere, con autorización del propietario.
- **Auditoría (`npm audit`)**: 11 avisos en dependencias transitivas de herramientas (`mysql2` vía CLI de Prisma, no se usa MySQL; `fflate` vía Satori, solo descomprime fuentes versionadas). La corrección automática degrada versiones mayores (`prisma@6`, `satori@0.32`), así que no se aplica; se revisa al actualizar.
