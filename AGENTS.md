# Guía para agentes — Festival Social Grid

## Fuente de verdad y estado del proyecto

- Leé `PRD2.md` antes de proponer o implementar cambios. Sus RF, RNF, AC y exclusiones definen el alcance del MVP. Vinculá cada cambio con los criterios de aceptación que corresponda; no conviertas supuestos en requisitos.
- El producto representa **un único festival argentino por despliegue**. La configuración del festival y el CSV versionado se aprovisionan por desarrollo; no construyas administración de festivales ni carga de datos desde la interfaz.
- Stack acordada: **Next.js para interfaz y backend dentro de Next.js**, y **PostgreSQL** para persistencia.
- Estilos: **Tailwind CSS** es la única librería de estilos. No agregues CSS Modules, CSS-in-JS, kits de componentes ni otra librería de estilos sin acuerdo del propietario.
- Vercel es una posibilidad de hosting, **no una decisión confirmada**.
- Este documento fija reglas de trabajo, no una arquitectura detallada ni comandos que aún no existen. Antes de ejecutar pruebas o generar código, inspeccioná la estructura real del repositorio.

## Decisiones y planificación

1. Investigá el código, las restricciones pertinentes del PRD y las alternativas antes de implementar una funcionalidad o cambiar arquitectura. Presentá un diseño breve con alcance, impactos, riesgos, pruebas y criterios de aceptación afectados.
2. **Ante cualquier duda o decisión técnica no resuelta, preguntale al propietario y esperá su respuesta antes de fijarla o implementarla.** No elijas por defecto proveedor, librería, ORM, esquema de autenticación, servicio de email, hosting, estrategia de despliegue ni otra dependencia sin acuerdo. Si hay varias opciones razonables, explicá la recomendación y el intercambio entre ellas.
3. Trabajá en unidades pequeñas y revisables: una conducta verificable por unidad, con pruebas y documentación relacionadas. Mantené un commit por unidad de trabajo terminada; no mezcles cambios inconexos. Pedí autorización antes de publicar o desplegar.
   - Para cada commit usá la skill `conventional-commit`.
4. No amplíes silenciosamente el alcance: lo excluido en `PRD2.md` sigue fuera de alcance. Si un criterio es ambiguo, consultá antes de diseñar su implementación.

## Pruebas primero

- Para cada conducta nueva o corrección, empezá por una prueba que exprese el criterio de aceptación y comprobá que falle por la razón esperada. Después implementá el mínimo cambio para que pase y refactorizá sin perder cobertura. Si no es posible demostrar el fallo inicial, explicá por qué antes de continuar.
- Herramientas acordadas: **Vitest + React Testing Library** para lógica y componentes; **integración contra una PostgreSQL de prueba** para persistencia, endpoints, importación y autorización; **Playwright** para flujos completos en navegador, en especial renderizado de componentes de servidor asíncronos.
- No sustituyas pruebas de permisos y persistencia por mocks únicamente. Probá tanto acceso permitido como denegado, incluidos usuarios ajenos a grupos o invitaciones y exportaciones no públicas.
- Verificá los casos temporales en los límites de inicio y fin con instante UTC del servidor y zona fija `America/Argentina/Buenos_Aires`; no dependas del reloj del dispositivo ni de la zona local del servidor.
- Los objetivos p95 y los fixtures exactos están en RNF-01 y RNF-03. Se necesitan pruebas de carga reproducibles en el entorno de CI indicado allí; **la herramienta para esas pruebas sigue pendiente de elección**. No afirmes que se cumplen los objetivos sin medirlos bajo esas condiciones.
- Antes de cerrar una unidad, ejecutá las pruebas pertinentes y los controles disponibles en el repositorio. Informá comandos, resultados y verificaciones omitidas o bloqueadas; no inventes scripts todavía inexistentes.

## Seguridad y datos

- Protegé del lado del servidor todo contenido y recurso: line-up, perfiles completos, selecciones, grupos, invitaciones y PNG. Las búsquedas para invitar solo deben exponer nombre de usuario y avatar.
- Respetá el formato y el almacenamiento con hash del PIN, el bloqueo por intentos fallidos, la respuesta uniforme de error y TLS conforme al PRD. Nunca registres secretos ni PIN en archivos versionados.
- El importador CSV debe validar antes de cargar y evitar estados parcialmente aprovisionados. Conservá identificadores estables y evaluá el impacto en selecciones existentes al cambiar el line-up.
- No agregues servicios, cuentas ni infraestructura real para pruebas sin acordar previamente su alcance y manejo de credenciales.
- **Nunca ejecutes comandos que requieran root o permisos de administrador** (`sudo`, cambios de grupos, servicios del sistema, etc.). Informá qué comando hace falta y para qué; siempre lo ejecuta el propietario.

## Pendientes que requieren consulta

- Hosting definitivo (Vercel es solo candidato) y estrategia de despliegue.
- Elección de herramienta y ejecución en CI para las pruebas de carga.
- Selección de proveedores y librerías no acordados, y decisiones de arquitectura que el PRD no especifica.

Si una decisión pendiente bloquea una unidad, exponé alternativas concretas y detené esa unidad hasta obtener respuesta. No presentes un supuesto como si fuera una decisión del proyecto.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
