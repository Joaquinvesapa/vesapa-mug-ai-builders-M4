# Quickstart de validación — Festival Social Grid

Guía para comprobar el MVP de punta a punta. Los scripts se definirán en `package.json` durante la implementación; los nombres de abajo son los previstos y se actualizarán si cambian.

## Prerrequisitos

- Node.js LTS y el gestor de paquetes del proyecto.
- Docker accesible sin `sudo` (Testcontainers). Si no lo está, el propietario debe configurarlo.
- Variables de entorno en `.env.local` (no versionado), según `.env.example`: `POSTGRES_PASSWORD`, `DATABASE_URL`, `AUTH_SECRET` y, opcionalmente, `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`. Las carga el propietario.

## Puesta en marcha

1. `npm install`.
2. Base de desarrollo: `npm run db:up` (Docker Compose, `compose.yaml`; contraseña desde `POSTGRES_PASSWORD` en `.env.local`).
3. Migraciones: `npm run db:migrate`.
4. Importar el line-up: `npm run import:lineup -- data/lineup.csv`.
5. Iniciar: `npm run dev`.

## Validaciones

| Escenario | Cómo | Resultado esperado |
|---|---|---|
| Lógica de dominio y componentes (tiempo, layout, superposición, coincidencias, estados en vivo) | `npm run test:unit` | AC-34, AC-41/42, AC-70…77, AC-80…86, AC-108, AC-110 en verde |
| Importador, auth PIN, grupos, permisos, exportación (píxeles reales), privacidad | `npm run test:integration` (Docker) | AC-01/03/109, AC-06…21, AC-23…30, AC-44…79, AC-87…95, AC-98…104, AC-111/112 en verde |
| Flujos en navegador: acceso, grilla, gestos, grupos, vista grupal, descarga de PNG, perfil, accesibilidad | `npm run test:e2e` (Chromium y Firefox; WebKit con `PW_WEBKIT=1`) | AC-05, AC-07, AC-10, AC-35…43, AC-105…107, FR-085, FR-090…097 en verde |
| Importación inválida | importar un CSV sin escenario o con 6 escenarios | el comando falla y no quedan shows nuevos (AC-03, AC-109) |
| Acceso | entrar con usuario nuevo + PIN, cerrar sesión, pedir `/grilla/...` | redirige a `/login` (AC-10) |
| Grupo | crear grupo, invitar a otra cuenta, aceptar, ver la vista grupal | conteo y coincidencia correctos (AC-70, AC-73) |
| Exportación | descargar personal y grupal en ambos formatos | PNG de 1080 × 1920 / 1080 × 1350 con la grilla completa |

## Bloqueadas por decisiones pendientes

- RNF-01 / RNF-03 (p95): requieren elegir la herramienta de carga y el ejecutor de CI.
- RNF-07 (TLS): depende del hosting elegido.
