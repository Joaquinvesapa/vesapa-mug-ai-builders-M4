# Festival Social Grid

MVP de grillas personales y grupales para un único festival argentino por despliegue.

- Alcance y requisitos: `PRD2.md` y `specs/001-festival-social-grid/spec.md`.
- Plan, modelo de datos y contrato: `specs/001-festival-social-grid/`.
- Validación de punta a punta: `specs/001-festival-social-grid/quickstart.md`.

## Probar localmente

Requiere Node.js 24 y Docker.

1. `cp .env.example .env.local` y completá `POSTGRES_PASSWORD` (cualquiera), `DATABASE_URL` con esa misma contraseña y `AUTH_SECRET` (`openssl rand -hex 32`). Google es opcional: sin `AUTH_GOOGLE_*` podés entrar con usuario y PIN.
2. `npm install`
3. `npm run db:up` — levanta PostgreSQL en `127.0.0.1` con un volumen persistente.
4. `npm run db:migrate`
5. `npm run import:lineup -- data/lineup.csv` — line-up de demostración.
6. `npm run dev` y abrí http://localhost:3000. Si el nombre de usuario no existe, se crea la cuenta con el PIN que ingreses.

`npm run db:down` detiene la base sin borrar los datos.

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run db:up` / `npm run db:down` / `npm run db:migrate` | Base local de desarrollo (Docker Compose) y migraciones |
| `npm run import:lineup -- <csv> [--allow-deletions]` | Importa el line-up |
| `npm run lint` / `npm run typecheck` | Controles estáticos |
| `npm run test:unit` | Vitest (jsdom) sobre `tests/unit/` |
| `npm run test:integration` | Vitest + PostgreSQL efímera (Testcontainers, requiere Docker) sobre `tests/integration/` |
| `npm run test:e2e` | Playwright sobre `tests/e2e/` |

Las variables de entorno se documentan en `.env.example`; los valores reales van en `.env.local`, que no se versiona.
