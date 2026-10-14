# Festival Social Grid Constitution

## Core Principles

### I. Commits por unidad de trabajo validada

- El trabajo MUST dividirse en unidades pequeñas, cada una con una sola conducta verificable.
- Cada unidad terminada MUST producir exactamente un commit que incluya su implementación,
  sus pruebas y la documentación relacionada; no se mezclan cambios inconexos.
- Una unidad solo se commitea cuando sus pruebas pertinentes y los controles disponibles del
  repositorio pasan. Los commits MUST seguir Conventional Commits (skill `conventional-commit`).

**Rationale**: con un único desarrollador, el historial es la principal herramienta de revisión
y de vuelta atrás; unidades pequeñas y validadas lo mantienen confiable.

### II. Pruebas primero (NO NEGOCIABLE)

- Toda conducta nueva o corrección MUST empezar por una prueba que exprese el criterio de
  aceptación, antes de escribir la implementación.
- Ciclo obligatorio rojo → verde → refactor: la prueba MUST fallar primero por la razón
  esperada; luego se implementa el mínimo cambio para que pase; luego se refactoriza sin
  perder cobertura.
- Si no se puede demostrar el fallo inicial, MUST explicarse el motivo antes de continuar.

**Rationale**: la prueba en rojo demuestra que verifica algo real; sin ella, una prueba verde no
prueba nada.

### III. Reutilizar pruebas antes que crear nuevas

- Antes de crear una prueba nueva, MUST revisarse si existe una prueba que cubra la misma
  conducta o una cercana; si existe, MUST extenderse o modificarse esa prueba.
- Solo se crea una prueba nueva cuando ninguna existente puede expresar el criterio sin perder
  claridad; esa decisión SHOULD justificarse brevemente en la unidad de trabajo.
- No se agregan pruebas duplicadas ni redundantes con otras ya existentes.

**Rationale**: menos pruebas, más significativas, reducen mantenimiento y tiempo de ejecución.

### IV. Autorización humana para acciones destructivas

Toda acción destructiva MUST esperar autorización explícita del propietario antes de
ejecutarse, aunque haya sido autorizada en otro contexto. Se considera destructiva toda acción
que pueda perder datos o trabajo, o que no se pueda revertir fácilmente en forma local:

- Borrar o sobrescribir archivos o directorios con contenido existente no generado en la unidad
  actual (incluye `rm`, mover sobre destino existente, vaciar archivos).
- Operaciones Git que reescriben o descartan historia o cambios: `reset --hard`, `push --force`,
  `rebase` sobre ramas publicadas, `clean`, `checkout`/`restore` que descarten cambios, borrar
  ramas o tags, `stash drop`.
- Publicar o afectar sistemas externos: `git push`, despliegues, publicación de paquetes,
  llamadas que modifiquen servicios remotos.
- Operaciones de base de datos que eliminen o alteren datos o esquema fuera de una base
  efímera de pruebas: `DROP`, `TRUNCATE`, `DELETE`/`UPDATE` masivos, migraciones destructivas,
  reimportaciones que reemplacen datos.
- Cambios masivos de dependencias o configuración (eliminar dependencias, actualizar versiones
  mayores, regenerar lockfiles).
- Cualquier comando que requiera root o permisos de administrador: el agente nunca lo ejecuta;
  informa el comando y su propósito y lo ejecuta el propietario.

Ante la duda sobre si una acción es destructiva, MUST tratarse como destructiva.

**Rationale**: el costo de pedir confirmación es bajo; el de perder datos o historia no lo es.

### V. Cero secretos accesibles para el agente

- Ningún secreto (credenciales, tokens, claves, cadenas de conexión con contraseña, PIN) MUST
  aparecer en código, pruebas, fixtures, documentación ni archivos versionados.
- Los secretos MUST leerse solo desde variables de entorno o un gestor externo; el repositorio
  solo puede versionar plantillas sin valores reales (por ejemplo `.env.example`).
- El agente MUST NOT leer, imprimir ni registrar secretos ni archivos que los contengan
  (`.env*` con valores reales, archivos de credenciales). Si una tarea requiere secretos, el
  agente MUST pedir al propietario que los configure o que ejecute él mismo el comando.

**Rationale**: un secreto expuesto al agente o al historial debe considerarse filtrado.

## Restricciones del proyecto

- Fuente de verdad del alcance: `PRD2.md` (RF, RNF, AC y exclusiones). Lo excluido sigue fuera
  de alcance.
- Stack acordada: Next.js (interfaz y backend), PostgreSQL, Tailwind CSS como única librería de
  estilos.
- Herramientas de prueba: Vitest + React Testing Library; integración contra PostgreSQL de
  prueba; Playwright para flujos completos.
- Decisiones no resueltas (hosting, herramienta de pruebas de carga, proveedores, librerías,
  arquitectura no especificada) MUST consultarse al propietario antes de fijarse.

## Flujo de desarrollo

1. Investigar código y PRD; presentar diseño breve (alcance, impactos, riesgos, pruebas, AC).
2. Ubicar pruebas existentes a modificar (Principio III); si no hay, escribir una nueva.
3. Rojo: ejecutar y confirmar el fallo esperado.
4. Verde: implementación mínima. Refactor: limpiar manteniendo las pruebas en verde.
5. Ejecutar pruebas y controles pertinentes; informar comandos, resultados y lo omitido.
6. Commit de la unidad (Principio I). Cualquier paso destructivo espera autorización
   (Principio IV).

## Governance

- Esta constitución prevalece sobre otras prácticas; `AGENTS.md` aporta la guía operativa y no
  puede contradecirla.
- Las enmiendas requieren aprobación del propietario, actualización de este archivo y del
  número de versión según SemVer: MAJOR para eliminar o redefinir principios, MINOR para
  agregar principios o ampliar materialmente la guía, PATCH para aclaraciones de redacción.
- Cada unidad de trabajo MUST verificar el cumplimiento de los principios antes del commit;
  cualquier excepción MUST justificarse y ser aprobada por el propietario.

**Version**: 1.0.0 | **Ratified**: 2026-10-13 | **Last Amended**: 2026-10-13
