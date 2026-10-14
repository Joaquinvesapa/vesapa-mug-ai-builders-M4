# Validación del quickstart — 2026-10-14

Ejecutada sobre el commit `8c83252` (más los cambios de esta validación), Node 24.21, Docker 29.7, Linux.

## Suites automáticas

| Control | Comando | Resultado |
|---|---|---|
| Lint | `npm run lint` | OK |
| Tipos | `npm run typecheck` | OK |
| Unitarias y componentes | `npm run test:unit` | 15 archivos, 109 pruebas en verde |
| Integración (PostgreSQL efímera) | `npm run test:integration` | 20 archivos, 148 pruebas en verde |
| E2E (Chromium móvil, Chromium y Firefox de escritorio) | `npm run test:e2e` | 114 pruebas en verde |
| Build de producción | `npm run build` | OK |

## Flujo manual del quickstart

Contra la app compilada (`next start`) y una base Compose aislada (`-p fsg-quickstart`, contraseña descartable, eliminada al final con `down -v`).

| Paso | Resultado |
|---|---|
| `db:up` / `db:migrate` | Contenedor saludable; migración aplicada |
| Importar `data/lineup.csv` | 99 shows creados |
| Importar CSV con un show sin escenario (AC-03) | Rechazado con código 1 (`línea 3: falta stage`); siguen 99 shows |
| Importar CSV con 6 escenarios (AC-109) | Rechazado con código 1; siguen 99 shows |
| `GET /grilla/2026-11-21` sin sesión (AC-98) | 307 a `/login` |
| Alta con usuario y PIN (AC-07) | `{"ok":true}` con cookie de sesión |
| `GET /grilla/2026-11-21` con sesión | 200 con el line-up del día |
| Exportación personal 1080 × 1350 (AC-88, FR-070) | 200 `image/png`, PNG de 1080 × 1350, `grilla-personal-2026-11-21-1080x1350.png` |
| Exportación grupal sin pertenecer a un grupo (AC-104) | 404 `{"error":"not_found"}` |

## No verificado

- **WebKit / Safari iOS (FR-084):** el navegador no arranca en esta máquina por bibliotecas del sistema faltantes que requieren `sudo`; las e2e corren con `PW_WEBKIT=1` donde estén disponibles (por ejemplo, la imagen oficial de Playwright).
- **Acceso con Google real (AC-05):** requiere credenciales OAuth en `.env.local`; cubierto con el adaptador simulado en integración.
- **RNF-01 / RNF-03 (p95, T084, T085):** bloqueados hasta elegir la herramienta de carga y el ejecutor de CI; el fixture ya existe (`tests/fixtures/perf/seed.ts`).
- **RNF-07 / AC-22 (TLS, T086):** depende del hosting.
- **SC-008 (T087):** prueba de uso manual con 5 personas, a cargo del propietario.
