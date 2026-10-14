# Festival Social Grid

Aplicación web para consultar el line-up de **un festival de música argentino**, armar tu grilla personal y coordinar con tu grupo qué shows ven juntos.

> **Estado:** MVP en desarrollo. Se ejecuta solo en local: el hosting, TLS y la integración continua están diferidos por decisión del propietario.

## Qué hace

- **Un festival por despliegue.** Los datos del festival (nombre y días) se configuran en código (`config/festival.ts`) y el line-up se carga con un importador CSV. No hay panel de administración.
- **Acceso obligatorio.** Todo el contenido requiere sesión. Se entra con **nombre de usuario + PIN de 6 dígitos** (si el usuario no existe, se crea la cuenta) o con **Google** (opcional).
- **Grilla del día.** Los escenarios son columnas y el horario es el eje vertical, como las grillas que publican los festivales. Con un toque seleccionás o deseleccionás un show; si lo mantenés presionado, se abre el detalle.
- **Grupos privados.** Hasta 15 miembros, con invitaciones por nombre de usuario que vencen a los 15 minutos. La vista grupal muestra cuántos miembros eligieron cada show y marca las **coincidencias** (2 o más miembros).
- **Exportación a PNG.** Grilla personal o grupal de un día en 1080 × 1920 (historia) o 1080 × 1350 (post).
- **Perfil.** El avatar es una forma abstracta con color configurable. La búsqueda para invitar solo muestra el nombre de usuario y el avatar.
- **Tiempo autoritativo.** El servidor entrega el instante UTC y el cálculo de estados (próximo, en vivo, terminado) usa siempre la zona `America/Argentina/Buenos_Aires`.

Los requisitos completos están en [`PRD2.md`](PRD2.md); la especificación, el plan y el modelo de datos, en [`specs/001-festival-social-grid/`](specs/001-festival-social-grid/).

## Stack

| Capa | Tecnología |
|---|---|
| App y backend | Next.js 16 (App Router, Route Handlers, Server Actions) con React 19 |
| Estilos | Tailwind CSS 4 (única librería de estilos) |
| Persistencia | PostgreSQL 17 con Prisma 7 (`@prisma/adapter-pg`) |
| Autenticación | Auth.js (`next-auth` v5) para Google y sesiones en base; PIN con hash argon2 |
| PNG | Satori + resvg |
| Pruebas | Vitest + React Testing Library, Testcontainers (PostgreSQL efímera), Playwright, k6 (carga) |

## Requisitos previos

| Herramienta | Versión verificada | Para qué |
|---|---|---|
| Node.js | 24 (probado con 24.21) | App, scripts y pruebas |
| npm | el que trae Node 24 | Gestor de paquetes de los scripts (ver [Notas](#notas-y-problemas-frecuentes)) |
| Docker + Docker Compose | Docker 29, Compose v2+ | Base de desarrollo, pruebas de integración, e2e y carga |
| `openssl` | cualquiera | Generar `AUTH_SECRET` y las credenciales descartables de la prueba de carga |

Docker tiene que funcionar **sin `sudo`** (tu usuario debe estar en el grupo `docker`), porque Testcontainers y los scripts lo llaman directamente.

## Puesta en marcha paso a paso

Cada paso incluye cómo verificar que salió bien. Los comandos se ejecutan desde la raíz del repositorio.

### 1. Clonar e instalar dependencias

```bash
git clone git@github.com:Joaquinvesapa/vesapa-mug-ai-builders-M4.git
cd vesapa-mug-ai-builders-M4
npm install
```

`postinstall` ejecuta `prisma generate` y genera el cliente en `src/generated/prisma/`, que no se versiona.
**Verificación:** existe la carpeta `src/generated/prisma/`.

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editá `.env.local`:

| Variable | Obligatoria | Valor |
|---|---|---|
| `POSTGRES_PASSWORD` | Sí | Cualquier contraseña para la base local, por ejemplo `openssl rand -hex 16`. |
| `POSTGRES_PORT` | No (por defecto `5432`) | Puerto del host donde se publica PostgreSQL. Cambialo si `5432` está ocupado. |
| `DATABASE_URL` | Sí | `postgresql://festival:<POSTGRES_PASSWORD>@127.0.0.1:<POSTGRES_PORT>/festival` |
| `AUTH_SECRET` | Sí | `openssl rand -hex 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | No | Cliente OAuth de Google. Sin estas variables, el acceso con usuario y PIN funciona igual; solo falla el botón de Google. |

Si configurás Google, registrá esta URI de redirección en el cliente OAuth: `http://localhost:3000/api/auth/callback/google`.

> `.env.local` no se versiona (lo ignora `.gitignore`). Nunca subas secretos ni PIN al repositorio.

### 3. Levantar PostgreSQL

```bash
npm run db:up
```

Levanta `postgres:17-alpine` con Docker Compose (`compose.yaml`), publicado solo en `127.0.0.1` y con un volumen persistente (`db-data`). El comando espera a que el contenedor esté sano.
**Verificación:** `docker compose --env-file .env.local ps` muestra `festival-social-grid-db-1` como `healthy`.

### 4. Aplicar migraciones

```bash
npm run db:migrate
```

Ejecuta `prisma migrate deploy` con las migraciones de `prisma/migrations/`. El CLI de Prisma no lee `.env.local` por sí mismo; `prisma.config.ts` lo carga.
**Verificación:** termina con `All migrations have been successfully applied.` o, si ya estaban aplicadas, con `No pending migrations to apply.`.

### 5. Cargar el line-up de demostración

```bash
npm run import:lineup -- data/lineup.csv
```

**Verificación:** la primera vez imprime `Line-up importado: 99 creados, 0 actualizados, 0 eliminados.`. Repetir el comando es seguro: actualiza los mismos 99 shows.

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abrí <http://localhost:3000>.
**Verificación:**

- `/login` responde 200.
- `/grilla/2026-11-20` sin sesión redirige (307) a `/login`.
- `/api/time` sin sesión responde 401.

### 7. Probar la app a mano

1. En `/login`, ingresá un usuario nuevo (de 3 a 30 caracteres: letras sin acentos, números, `.` o `_`) y un PIN de **exactamente 6 dígitos**. Como el usuario no existe, se crea la cuenta y entrás a la grilla del día.
2. Tocá bloques para seleccionar shows. Si mantenés presionado un bloque, se abre el detalle.
3. Abrí otra ventana privada (u otro navegador) y creá un segundo usuario.
4. Con el primer usuario, creá un grupo en `/grupo` e invitá al segundo por su nombre de usuario.
5. Con el segundo usuario, aceptá la invitación en `/invitaciones` (vence a los 15 minutos).
6. Seleccioná el mismo show con ambos usuarios y abrí la vista grupal: el show aparece como coincidencia con los nombres de quienes lo eligieron.
7. Descargá el PNG personal o grupal desde el diálogo de exportación.
8. En `/perfil`, cambiá la forma o el color del avatar.

Para detener la base sin borrar datos, usá `npm run db:down`.

## Datos de prueba

### Line-up de demostración (`data/lineup.csv`)

- **99 shows** ficticios en **3 días** (`2026-11-20`, `2026-11-21` y `2026-11-22`) y **5 escenarios**: Escenario Norte, Escenario Sur, Escenario Río, Patio Acústico y Carpa Electrónica.
- Los días coinciden con el festival de demostración de `config/festival.ts` (`"Festival de demostración"`). El importador rechaza los días que no estén en esa configuración.

**No hay usuarios, grupos ni selecciones precargados.** Las cuentas se crean al iniciar sesión con un usuario y un PIN nuevos (paso 7).

### Estados temporales (próximo, en vivo, terminado)

Los estados se calculan con la hora real del servidor. Como el festival de demostración es en noviembre de 2026, antes de esas fechas todos los shows aparecen como próximos. Para ver shows en vivo o terminados en desarrollo, agregá temporalmente el día de hoy a `days` en `config/festival.ts` e importá un CSV con shows de ese día. No hay forma de simular el reloj: es intencional, porque el tiempo lo define el servidor.

### Fixtures de las suites automáticas (no tocan tu base de desarrollo)

| Fixture | Uso |
|---|---|
| `tests/fixtures/lineup/*.csv` | Casos válidos e inválidos del importador (sin escenario, 6 escenarios, actualización con baja) y line-ups de e2e y exportación |
| `tests/fixtures/perf/seed.ts` | Fixture de RNF-01: 150 shows y un grupo de 15 miembros con 30 shows cada uno (PIN `135790`). Solo se carga en el stack aislado de `npm run test:load`. |

## Configuración del festival

`config/festival.ts` define el festival del despliegue:

```ts
export const festival: FestivalConfig = {
  name: "Festival de demostración",
  country: "AR",
  timeZone: FESTIVAL_TIME_ZONE, // America/Argentina/Buenos_Aires
  days: ["2026-11-20", "2026-11-21", "2026-11-22"],
};
```

Son valores de demostración hasta que el propietario defina el festival real.

## Importar un line-up

```bash
npm run import:lineup -- <archivo.csv> [--allow-deletions]
```

Formato del CSV (el encabezado debe coincidir exactamente):

```csv
id,artist,description,day,stage,start,end
show-001,Fuego Faros,Rock,2026-11-20,Escenario Norte,16:00,17:00
```

| Regla | Detalle |
|---|---|
| Columnas | Las 7 son obligatorias. `day` usa `YYYY-MM-DD`; `start` y `end`, `HH:MM` en hora argentina. |
| `id` | Identificador estable y único. Reimportar el mismo `id` actualiza el show y conserva sus selecciones. |
| Días | `day` tiene que estar en `config/festival.ts`. |
| Después de medianoche | Las horas anteriores a las `06:00` corresponden a la madrugada siguiente, pero el show sigue perteneciendo al `day` indicado (por ejemplo, `day=2026-11-21` con `start=01:00` es la madrugada del 22). |
| Escenarios | Máximo 5. El orden de las columnas sigue el orden de aparición en el CSV. |
| Duración | `end` debe ser posterior a `start`. |
| Atomicidad | Se valida todo antes de cargar. Si hay un error, se informa cada línea con problemas, no se modifica nada y el comando termina con código 1. |
| Bajas | Si faltan shows que ya existían, la importación se rechaza salvo que uses `--allow-deletions`, que **borra esos shows y sus selecciones**. |

## Pruebas

| Suite | Comando | Necesita | Qué cubre |
|---|---|---|---|
| Lint | `npm run lint` | — | ESLint |
| Tipos | `npm run typecheck` | — | `next typegen` + `tsc --noEmit` |
| Unitarias y componentes | `npm run test:unit` | — | Vitest + jsdom sobre `tests/unit/` (dominio, layout, tiempo, componentes) |
| Integración | `npm run test:integration` | Docker | Vitest contra una **PostgreSQL efímera** (Testcontainers): importador, auth por PIN, grupos, permisos, privacidad y exportación con píxeles reales |
| E2E | `npm run test:e2e` | Docker + navegadores de Playwright | Flujos completos en Chromium móvil, Chromium y Firefox de escritorio, incluida la accesibilidad con axe |
| Carga | `npm run test:load` | Docker | k6 en Docker contra un stack aislado limitado a 2 vCPU y 4 GB: p95 < 2 s en consultas y < 5 s en exportación (RNF-01 y RNF-03) |

Ninguna suite usa tu base de desarrollo ni `.env.local`: cada una levanta su propia base descartable y la elimina al terminar.

### Antes de la primera corrida de e2e

```bash
npx playwright install chromium firefox
```

### Detalles de cada suite

- **Integración:** `tests/integration/setup/global-setup.ts` levanta `postgres:17-alpine` con Testcontainers, aplica las migraciones y vacía las tablas antes de cada prueba. Los archivos se ejecutan en serie.
- **E2E:** Playwright ejecuta `npm run build` y luego `scripts/e2e-server.mts`, que levanta una PostgreSQL efímera, migra, importa `tests/fixtures/lineup/e2e.csv` y sirve la app con `next start` en el puerto **3100** (configurable con `E2E_PORT`). Fuera de CI se **reutiliza** un servidor que ya esté escuchando en ese puerto; si tenés algo viejo corriendo ahí, detenelo antes.
- **WebKit / Safari iOS:** está desactivado por defecto porque requiere bibliotecas del sistema. Activalo con `PW_WEBKIT=1 npm run test:e2e` donde estén disponibles, por ejemplo en la imagen oficial de Playwright.
- **Carga:** `scripts/load-test.sh` compila la app (`SKIP_BUILD=1` reutiliza `.next`), levanta base y app con `tests/load/compose.yaml` (base en el puerto `55440`, configurable con `LOAD_DB_PORT`), carga el fixture de rendimiento y ejecuta las suites `queries` y `export` de k6. Las credenciales son descartables y todo se elimina al final. Los resultados quedan en `tests/load/results/`. El comando falla si se supera un umbral; `LOAD_SUITES=queries` ejecuta una sola suite.

### Última validación registrada

En [`specs/001-festival-social-grid/validation-2026-10-14.md`](specs/001-festival-social-grid/validation-2026-10-14.md) se registró: lint y tipos OK, 109 pruebas unitarias, 148 de integración y 114 e2e en verde, build OK y p95 de carga entre 141 ms y 206 ms.

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo en <http://localhost:3000> |
| `npm run build` / `npm run start` | Build de producción y servidor compilado |
| `npm run db:up` / `npm run db:down` | Levanta o detiene la base local (Docker Compose); `db:down` conserva los datos |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run import:lineup -- <csv> [--allow-deletions]` | Importa el line-up |
| `npm run lint` / `npm run typecheck` | Controles estáticos |
| `npm run test:unit` / `test:integration` / `test:e2e` / `test:load` | Suites de prueba (ver [Pruebas](#pruebas)) |

## Estructura del repositorio

```text
config/festival.ts      Configuración del festival del despliegue
data/lineup.csv         Line-up de demostración
prisma/                 Esquema y migraciones
scripts/                Importador, servidor de e2e, seed de rendimiento y prueba de carga
src/app/                Rutas: (auth) login y bienvenida; (app) grilla, grupo, invitaciones y perfil; api/*
src/components/         Grilla, grupo, avatar y exportación
src/domain/             Lógica pura: tiempo, layout, superposiciones, coincidencias, validación del CSV
src/export/             Escena y render del PNG (Satori + resvg)
src/server/             Acceso a datos, sesión, auth, grupos, selección e importación
tests/                  unit/, integration/, e2e/, load/ y fixtures/
specs/                  Especificación, plan, contratos, tareas y validaciones
PRD2.md                 Requisitos del producto (fuente de verdad)
AGENTS.md               Reglas de trabajo para agentes
```

## Notas y problemas frecuentes

- **El puerto 5432 está ocupado:** cambiá `POSTGRES_PORT` en `.env.local` y el puerto de `DATABASE_URL`, y después ejecutá `npm run db:up` otra vez.
- **`permission denied` al usar Docker:** tu usuario no puede usar Docker sin `sudo`. Hay que agregarlo al grupo `docker` (por ejemplo, `sudo usermod -aG docker $USER` y volver a iniciar sesión). Esto lo hace quien administra la máquina.
- **El usuario queda bloqueado:** después de 5 PIN incorrectos, la cuenta se bloquea durante 15 minutos. Por seguridad, el error es el mismo para un PIN incorrecto, una cuenta bloqueada o una cuenta de Google.
- **Gestor de paquetes:** los scripts usan `npm`, y `package-lock.json` es el lockfile que corresponde. También hay un `pnpm-lock.yaml` versionado; no mezcles gestores en una misma instalación.
- **Base desde cero:** `docker compose --env-file .env.local down -v` **borra el volumen y todos los datos locales** (usuarios, grupos y selecciones). Después repetí los pasos 3 a 5.
- **Login con Google en local:** sin `AUTH_GOOGLE_*`, el botón de Google falla, pero el acceso con PIN funciona. Las cuentas de Google eligen su nombre de usuario en `/bienvenida` la primera vez.

## Para agentes

Leé [`AGENTS.md`](AGENTS.md) antes de cambiar código: define el alcance (`PRD2.md`), el flujo con pruebas primero, los commits convencionales y las decisiones que hay que consultar con el propietario. Secuencia mínima para dejar el entorno listo y verificado:

```bash
npm install
cp .env.example .env.local   # completar POSTGRES_PASSWORD, DATABASE_URL y AUTH_SECRET
npm run db:up && npm run db:migrate && npm run import:lineup -- data/lineup.csv
npm run lint && npm run typecheck && npm run test:unit && npm run test:integration
npm run dev
```
