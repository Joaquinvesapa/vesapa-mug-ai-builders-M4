---
name: conventional-commit
description: Define el formato Conventional Commits y las reglas de commits del proyecto. Se usa siempre que haya que hacer uno o varios commits, para respetar este formato sin excepción.
---

# Conventional Commit

Aplicá estas reglas en TODOS los commits, sin excepción.

## Formato del mensaje

```
<tipo>(<alcance opcional>): <descripción en imperativo>

<cuerpo opcional>

<footer opcional>
```

Tipos válidos: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`,
`ci`, `perf`.

## Reglas

- La descripción va en español, en imperativo, en minúscula y sin punto final.
- El alcance es opcional y va entre paréntesis: `docs(prd): ...`.
- El cuerpo es opcional: separalo con una línea en blanco y usalo para explicar
  el qué y el porqué, no el cómo.
- El footer es opcional: referencias a issues o criterios (`Refs: AC-01`).
- Cambio incompatible: agregá `!` después del tipo/alcance (`feat(api)!: ...`)
  y/o un footer `BREAKING CHANGE: <qué se rompe y cómo migrar>`.

## Unidades de trabajo

- Un commit por unidad de trabajo terminada: una conducta verificable, con sus
  pruebas y documentación relacionadas.
- No mezcles cambios inconexos en el mismo commit. Si hay varios, hacé varios
  commits.
- Pedí autorización antes de publicar (push) o desplegar.

## Antes de commitear

1. Revisá `git status` y `git diff` para ver qué entra.
2. Agrupá los cambios por unidad de trabajo y stageá solo los de esa unidad.
3. Elegí el tipo que mejor describe el cambio y escribí el mensaje.
4. Verificá que el mensaje cumpla el formato antes de ejecutar el commit.
