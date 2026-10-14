# Festival Social Grid

MVP de grillas personales y grupales para un único festival argentino por despliegue.

- Alcance y requisitos: `PRD2.md` y `specs/001-festival-social-grid/spec.md`.
- Plan, modelo de datos y contrato: `specs/001-festival-social-grid/`.
- Validación de punta a punta: `specs/001-festival-social-grid/quickstart.md`.

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` / `npm run typecheck` | Controles estáticos |
| `npm run test:unit` | Vitest (jsdom) sobre `tests/unit/` |
| `npm run test:integration` | Vitest + PostgreSQL efímera (Testcontainers, requiere Docker) sobre `tests/integration/` |
| `npm run test:e2e` | Playwright sobre `tests/e2e/` |

Las variables de entorno se documentan en `.env.example`; los valores reales van en `.env.local`, que no se versiona.
