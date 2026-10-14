# Feature Specification: Festival Social Grid — MVP de grillas personales y grupales

**Feature Branch**: `001-festival-social-grid`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Genera la spec a partir de @PRD2.md"

> Fuente de verdad: `PRD2.md`. Cada requisito y escenario referencia entre paréntesis los RF, RNF y AC del PRD para mantener la trazabilidad.

## Clarifications

### Session 2026-10-13

- Q: Si el propietario es el único miembro y quiere irse, ¿qué tiene que pasar? → A: No puede abandonar; debe eliminar el grupo explícitamente.
- Q: Cuando el propietario elimina el grupo, ¿qué pasa con las invitaciones vigentes? → A: Se invalidan al instante y desaparecen de la lista del invitado.
- Q: ¿El propietario puede ver las invitaciones que mandó mientras siguen pendientes? → A: Sí, ve destinatario, estado y vencimiento, y puede cancelarlas antes de que venzan.
- Q: ¿Cómo se muestra la vista grupal: sobre la grilla del día o como lista? → A: Grilla del día con conteos como vista principal, más una pestaña de lista ordenable y filtrable.
- Q: En la app, ¿qué pasa con un show cuyo bloque proporcional no alcanza para leer artista y horario? → A: El bloque sigue proporcional; primero se oculta el horario y luego se trunca el artista con “…”; el detalle muestra todo.

### Session 2026-10-14

- Q: Si al reimportar un show ya no figura en el CSV, ¿qué pasa con él y sus selecciones? → A: La importación se rechaza y lista los shows faltantes; solo se eliminan (con sus selecciones) al reejecutar con confirmación explícita de eliminación.
- Q: ¿Cómo coincide la búsqueda de personas y cuántos resultados muestra? → A: Por comienzo del nombre, sin distinguir mayúsculas; mínimo 2 caracteres; máximo 10 resultados; excluye a la propia persona.
- Q: ¿Qué hace inválido un show del CSV además de un campo faltante? → A: Fin no posterior al inicio, id repetido, día fuera de los días configurados del festival o más de 5 escenarios.
- Q: ¿Cuántas formas de avatar hay y qué avatar recibe una cuenta nueva? → A: 6 formas (círculo, cuadrado, triángulo, rombo, estrella, hexágono); la cuenta nueva recibe forma y color al azar.
- Q: ¿Cómo se comprueba que una persona encuentra un show, lo agrega y ve la coincidencia sin ayuda? → A: Prueba de uso manual con 5 personas antes del festival; se cumple si al menos 4 completan la tarea sin ayuda en menos de 3 minutos.
- Q: ¿Cuáles son los 5 colores de escenario, en orden? → A: violeta, fucsia, ámbar, esmeralda, celeste.
- Q: ¿Cómo se distingue un show resaltado de uno opacado en la app y el PNG? → A: Resaltado: color del escenario al 100 %, borde de 2 px y marca ✓; opacado/no seleccionado: mismo color al 35 %, sin borde.
- Q: ¿Qué caracteres se permiten en el nombre de usuario? → A: Letras a–z sin acentos, dígitos, punto y guion bajo; sin espacios; largo contado en caracteres.
- Q: En el PNG grupal, ¿qué shows llevan el conteo del grupo? → A: Solo los resaltados (propios); la grilla grupal de la app lo muestra en todos los elegidos por alguien. Diferencia intencional.
- Q: ¿Se puede invitar a alguien con una invitación vigente de otro grupo? → A: Sí; al aceptar una, las demás vigentes se invalidan en ese momento y liberan su lugar en el cupo.
- Q: ¿Se confirman los supuestos de nombre de grupo, desempate y actualización de la vista grupal? → A: Sí: nombre de 1–40 caracteres no único; empates por inicio y luego artista; actualización al abrir o con "Actualizar", sin tiempo real.
- Q: ¿Se aceptan los valores por defecto de UX para estados vacíos, día inicial, advertencia, estados temporales, miembro removido, cambio de nombre, falla de Google y grillas con menos de 5 escenarios? → A: Sí, tal cual (FR-090 a FR-097).
- Q: ¿Se aceptan las definiciones restantes (metadatos, perfil, CSV, PNG, escenarios FR-006/018, sin recortes, accesibilidad, sesión, retención, navegadores)? → A: Sí, tal cual; sesión, navegadores, accesibilidad y exclusión de retención agregadas a `PRD2.md` (RNF-13 a RNF-15).
- Q: ¿Cómo se expresa en el CSV un show que empieza o termina después de medianoche? → A: El día del festival arranca a las 06:00; toda hora de inicio o fin menor a 06:00 corresponde al día calendario siguiente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceder con una cuenta propia (Priority: P1)

Una persona entra a la aplicación con Google o con un nombre de usuario y un PIN de 6 dígitos. Si el nombre no existe, define su PIN y la cuenta se crea en ese momento. Sin sesión no ve ningún contenido.

**Why this priority**: todo el contenido requiere autenticación; sin acceso no hay producto.

**Independent Test**: crear una cuenta con nombre y PIN, cerrar sesión, volver a entrar, y verificar que sin sesión se deniega el line-up.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión con cuenta de Google válida, **When** autoriza el acceso, **Then** inicia sesión; si es su primer acceso, se le pide un nombre de usuario y no entra hasta fijarlo (AC-05, AC-11).
2. **Given** un nombre de usuario no registrado y válido, **When** la persona define un PIN de 6 dígitos, **Then** se crea la cuenta y se inicia sesión sin pedir otro nombre (AC-07).
3. **Given** la cuenta “Ana”, **When** alguien ingresa “aNA” con el PIN correcto, **Then** inicia sesión en “Ana” sin crear una cuenta duplicada (AC-08).
4. **Given** el formulario de acceso, **When** se ingresa un PIN de 5 o 7 dígitos o con letras, **Then** se rechaza (AC-06).
5. **Given** un nombre registrado, **When** se ingresa un PIN incorrecto, **Then** se rechaza sin iniciar sesión (AC-09).
6. **Given** un usuario con 5 fallos consecutivos, **When** ingresa el PIN correcto antes de 15 min 00 s del quinto fallo, **Then** se rechaza; a los 15 min 00 s se acepta (AC-15, AC-16, AC-17).
7. **Given** un usuario con 4 fallos, **When** inicia sesión con éxito y luego falla 4 veces más, **Then** el siguiente intento correcto se acepta (AC-18).
8. **Given** un PIN incorrecto y un usuario bloqueado, **When** se intenta acceder, **Then** ambas respuestas son indistinguibles (AC-19).
9. **Given** una cuenta creada con Google, **When** se intenta entrar con su nombre y cualquier PIN, **Then** se rechaza (AC-21).
10. **Given** una persona con sesión, **When** la cierra, **Then** toda solicitud posterior de contenido se deniega (AC-10).
12. **Given** la página de acceso, **When** se examinan sus opciones, **Then** no existe acceso, registro ni recuperación por email (FR-018).
11. **Given** una persona no autenticada, **When** intenta acceder al line-up, un detalle, una grilla, un grupo, una invitación o una exportación, **Then** se deniega sin exponer contenido (AC-98, AC-99, AC-100).

---

### User Story 2 - Consultar el line-up como grilla del día (Priority: P1)

Una persona autenticada elige un día del festival y ve su programación como una grilla de doble entrada: escenarios como columnas (cada uno con su color) y horario como eje vertical. Cada show es un bloque cuyo alto es proporcional a su duración. Al mantener presionado un bloque ve el detalle del show.

**Why this priority**: es la base de descubrimiento sobre la que se construyen la selección, los grupos y la exportación.

**Independent Test**: con un line-up aprovisionado, recorrer cada día y verificar posiciones, alturas, colores, desplazamiento en pantalla chica y apertura del detalle.

**Acceptance Scenarios**:

1. **Given** una persona autenticada, **When** recorre la grilla de cada día, **Then** ve todos los shows del festival exactamente una vez y en cada día solo los de ese día (AC-31, AC-32).
2. **Given** un festival con 5 escenarios, **When** se muestra la grilla, **Then** cada escenario tiene un color distinto asignado según su orden de aparición en el line-up, sus bloques usan ese color y las columnas siguen ese orden (AC-33).
3. **Given** un show del escenario B de 18:00 a 19:00 y otro de 18:00 a 18:30, **When** se muestra la grilla, **Then** el primero está en la columna B a la altura de 18:00 y mide el doble de alto que el segundo (AC-34).
4. **Given** un bloque, **When** se lo mantiene presionado, **Then** se abre el detalle con artista, descripción, día, escenario, inicio y finalización, y la selección no cambia (AC-35).
5. **Given** una pantalla de 375 px de ancho y un día con 5 escenarios, **When** se muestra la grilla, **Then** conserva las 5 columnas y la escala horaria y se puede desplazar en ambos ejes hasta ver todos los bloques (AC-105, AC-106).
6. **Given** un show del sábado de 00:30 a 01:30 del domingo, **When** se muestra la grilla del sábado, **Then** el bloque aparece al final del eje, después de las 23:59, y no aparece en la del domingo (AC-04, AC-107).

---

### User Story 3 - Armar la grilla personal (Priority: P1)

La persona toca un bloque para seleccionarlo o deseleccionarlo; también puede hacerlo desde el detalle. Sus shows seleccionados quedan resaltados en la grilla del día, y el sistema advierte superposiciones sin impedirlas. Cada show seleccionado muestra si está próximo, en vivo o finalizado según la hora autoritativa del servidor.

**Why this priority**: la agenda personal es el valor central del producto para cada asistente.

**Independent Test**: seleccionar y deseleccionar shows, incluyendo dos solapados, y verificar resaltado, advertencia y estados temporales en sus límites.

**Acceptance Scenarios**:

1. **Given** un show no seleccionado, **When** se toca su bloque o se agrega desde el detalle, **Then** queda seleccionado y resaltado (AC-36, AC-37).
2. **Given** un show seleccionado, **When** se toca su bloque o se quita desde el detalle, **Then** deja de estar seleccionado y las selecciones de otras personas no cambian (AC-38, AC-39).
3. **Given** 2 shows seleccionados y 3 no seleccionados de un día, **When** se muestra la grilla, **Then** exactamente 2 bloques aparecen resaltados (AC-40).
4. **Given** dos shows seleccionados con intervalos solapados, **When** se consulta la grilla, **Then** se muestra una advertencia que nombra a ambos y ambos permanecen seleccionados (AC-41, AC-43).
5. **Given** dos shows donde uno termina exactamente cuando empieza el otro, **When** se consulta la grilla, **Then** no hay advertencia (AC-42).
6. **Given** un show seleccionado, **When** el instante autoritativo es 1 ms antes del inicio, exactamente el inicio, 1 ms antes del final o exactamente el final, **Then** se muestra respectivamente “próximo”, “en vivo”, “en vivo” y “finalizado” (AC-80 a AC-83).
7. **Given** un dispositivo con hora distinta a la del servidor, **When** se consulta el estado, **Then** coincide con el calculado con la hora del servidor (AC-84).
8. **Given** una grilla abierta, **When** pasan 60 s desde el inicio o el final de un show, **Then** el estado visible cambió sin recarga (AC-85, AC-86).
9. **Given** dos personas A y B, **When** A intenta leer la grilla personal de B, **Then** se deniega (AC-101).

---

### User Story 4 - Crear y gestionar un grupo privado (Priority: P2)

Una persona sin grupo crea un grupo privado, invita a otros por nombre de usuario, y administra miembros y propiedad. Las invitaciones se ven dentro de la app y vencen a los 15 minutos.

**Why this priority**: habilita la coordinación entre amigos, pero depende de cuentas y grillas personales.

**Independent Test**: crear un grupo, invitar, aceptar, rechazar, dejar vencer invitaciones, transferir propiedad, eliminar miembros y eliminar el grupo, probando acciones permitidas y denegadas.

**Acceptance Scenarios**:

1. **Given** una persona sin grupo, **When** crea un grupo con nombre, **Then** figura como propietaria y miembro (AC-44).
2. **Given** una persona que ya pertenece a un grupo, **When** intenta crear otro o es invitada a otro, **Then** se rechaza (AC-47, AC-53).
3. **Given** un usuario registrado sin grupo, **When** el propietario lo invita por nombre de usuario, **Then** el usuario ve la invitación listada en la app; no existe invitación por email (AC-50, AC-51, AC-54).
4. **Given** una invitación de 14 min 59 s, **When** se acepta, **Then** la persona ingresa; con 15 min 00 s se rechaza (AC-55, AC-56, AC-59).
5. **Given** una invitación vigente, **When** el destinatario la rechaza, **Then** no ingresa y la invitación deja de estar vigente (AC-60).
6. **Given** un grupo con 14 miembros y 1 invitación vigente, **When** el propietario invita a otra persona, **Then** se rechaza; si la invitación está vencida, se acepta (AC-57, AC-58).
7. **Given** un grupo con 15 miembros, **When** el propietario intenta invitar, **Then** se rechaza (AC-46).
8. **Given** el propietario, **When** renombra el grupo, elimina a un miembro o transfiere la propiedad, **Then** el cambio se aplica; un miembro no propietario que intente lo mismo, invitar o eliminar el grupo es rechazado (AC-48, AC-49, AC-52, AC-62 a AC-65, AC-68).
9. **Given** un miembro no propietario, **When** abandona el grupo, **Then** deja de ser miembro y pierde acceso; el propietario sin transferir es rechazado al intentar abandonar, incluso si es el único miembro, y debe eliminar el grupo para irse (AC-61, AC-66).
10. **Given** el propietario, **When** elimina el grupo, **Then** el grupo deja de existir, todos pierden acceso y sus invitaciones vigentes desaparecen para los destinatarios (AC-67).
11. **Given** una invitación vigente, **When** el propietario la cancela, **Then** el destinatario deja de verla, ya no puede aceptarla y el lugar queda libre en el cupo; un miembro no propietario que intente cancelarla es rechazado (AC-111, AC-112).
12. **Given** una invitación dirigida a A, **When** otra persona intenta aceptarla, rechazarla o leerla sin ser propietaria del grupo, **Then** se deniega (AC-69, AC-103).
13. **Given** un grupo G, **When** una persona ajena intenta leerlo o modificarlo, **Then** se deniega (AC-102).

---

### User Story 5 - Ver coincidencias del grupo (Priority: P2)

Un miembro consulta la vista grupal y ve, por show, cuántos miembros lo eligieron. Los shows elegidos por al menos dos miembros se marcan como coincidencia y muestran quiénes los eligieron. Puede ordenar por horario o cantidad y filtrar solo coincidencias.

**Why this priority**: es el diferencial social del producto, sobre grupos y grillas personales.

**Independent Test**: con un grupo y selecciones conocidas, verificar conteos, nombres, marcas, orden, filtro y denegación a personas ajenas.

**Acceptance Scenarios**:

1. **Given** 3 miembros que seleccionaron el show X, **When** un miembro consulta la vista grupal, **Then** X muestra conteo 3 (AC-70).
2. **Given** un show con conteo 2, **When** se consulta la vista, **Then** se marca como coincidencia y muestra los 2 nombres; con conteo 1 no se marca ni muestra nombres (AC-71 a AC-74).
3. **Given** la vista grupal de un día, **When** se abre, **Then** se muestra la grilla del día con el conteo en cada bloque seleccionado por algún miembro y las coincidencias marcadas; desde una pestaña se pasa a la lista.
4. **Given** la lista de la vista grupal, **When** se ordena por horario, **Then** los shows aparecen por inicio ascendente; por cantidad, por conteo descendente (AC-75, AC-76).
5. **Given** la lista con shows de conteo 1 y 2, **When** se activa el filtro, **Then** solo se ven los de conteo ≥ 2 (AC-77).
6. **Given** un miembro que agrega o quita un show, **When** otro miembro consulta o actualiza la vista, **Then** el conteo refleja el cambio (AC-78).
7. **Given** un grupo G, **When** alguien ajeno a G consulta su vista grupal, **Then** se deniega sin exponer conteos ni nombres (AC-79).

---

### User Story 6 - Exportar la grilla como imagen (Priority: P3)

La persona elige un día y un formato (1080 × 1920 o 1080 × 1350) y descarga un PNG con la grilla completa de ese día, en la misma forma que en la app, con sus shows resaltados y el resto opacado. La versión grupal agrega conteos y, si se activa explícitamente, nombres de quienes coinciden.

**Why this priority**: facilita compartir el plan, pero no es necesaria para planificar.

**Independent Test**: exportar cada combinación personal/grupal × formato y verificar dimensiones, contenido, legibilidad, nombres y acceso.

**Acceptance Scenarios**:

1. **Given** una grilla personal, **When** se exporta en cada formato, **Then** el PNG mide exactamente 1080 × 1920 o 1080 × 1350 px (AC-87, AC-88).
2. **Given** un día con 8 shows de los que la persona seleccionó 2, **When** lo exporta, **Then** el PNG contiene los 8 en su columna y franja, con 2 resaltados y 6 opacados (AC-89).
3. **Given** el día con más escenarios y mayor rango horario, **When** se exporta en cada formato, **Then** todas las columnas y el rango completo entran sin recortes (AC-108).
4. **Given** un show de 15 minutos, **When** se exporta en 1080 × 1350, **Then** el artista se ve con fuente ≥ 20 px, truncado con “…” si no entra, y el horario se omite si falta lugar (AC-110).
5. **Given** un día con 40 shows, **When** se exporta, **Then** el PNG incluye los 40 (AC-95).
6. **Given** un miembro de grupo, **When** exporta la vista grupal, **Then** se resaltan solo sus shows y cada uno muestra el conteo del grupo (AC-90, AC-91).
7. **Given** la exportación grupal con nombres activados, **When** un show tiene conteo 2, **Then** se ven sus nombres; con conteo 1 no; sin activar nombres no se ve ninguno aun con conteo 3 (AC-92, AC-93, AC-94).
8. **Given** una exportación grupal de G, **When** alguien ajeno a G intenta generarla o descargarla, **Then** se deniega (AC-104).

---

### User Story 7 - Gestionar el perfil y buscar personas (Priority: P3)

La persona ve su perfil completo, cambia su nombre de usuario y elige un avatar (forma abstracta y color de una paleta fija). Puede buscar a otras personas por nombre, viendo solo su nombre y avatar.

**Why this priority**: personaliza y habilita invitaciones, pero el resto del producto funciona con valores por defecto.

**Independent Test**: editar el propio perfil, buscar usuarios y verificar que no se pueda leer ni modificar el perfil ajeno.

**Acceptance Scenarios**:

1. **Given** una persona autenticada, **When** consulta su perfil, **Then** ve su perfil completo (AC-23).
2. **Given** un nombre disponible, **When** lo adopta, **Then** el perfil muestra el nuevo nombre; nombres de 3 y 30 caracteres se aceptan, de 2 y 31 se rechazan, y “aNA” se rechaza si existe “Ana” (AC-12, AC-13, AC-14, AC-24).
3. **Given** una persona, **When** elige una forma y cambia su color, **Then** el avatar se muestra con esa forma y color (AC-25, AC-26).
4. **Given** una búsqueda de “an”, **When** se examinan los resultados, **Then** contienen los usuarios coincidentes con exactamente 2 campos: nombre de usuario y avatar (AC-27, AC-28).
5. **Given** dos personas A y B, **When** A intenta leer o modificar el perfil completo de B, **Then** se deniega y B no cambia (AC-29, AC-30).

---

### User Story 8 - Aprovisionar el festival (Priority: P1, operativa)

Desarrollo configura los metadatos del único festival argentino del despliegue e importa su line-up desde un archivo versionado. Ante cualquier dato inválido la importación completa se rechaza. No existe interfaz para esto.

**Why this priority**: sin datos aprovisionados no hay line-up que mostrar.

**Independent Test**: importar un archivo válido y otros inválidos, verificando el resultado en los datos disponibles.

**Acceptance Scenarios**:

1. **Given** metadatos de un festival argentino y un archivo válido, **When** desarrollo ejecuta la importación, **Then** queda exactamente 1 festival con todos los shows del archivo (AC-01).
2. **Given** el festival aprovisionado, **When** una persona recorre la interfaz, **Then** no encuentra elementos para elegir o gestionar festivales (AC-02).
3. **Given** un archivo con un show sin escenario, o con 6 escenarios distintos, **When** se importa, **Then** falla y quedan 0 shows de esa ejecución (AC-03, AC-109).
4. **Given** un line-up importado con selecciones, **When** se reimporta un archivo que omite un show, **Then** la importación se rechaza sin cambios y lista el faltante; con confirmación explícita de eliminación, el show y sus selecciones se eliminan y los demás ids se conservan (FR-006).

---

### Edge Cases

- Show que cruza la medianoche: pertenece al día indicado en el line-up y se ubica al final del eje de ese día (RF-71, RF-77).
- Shows contiguos (uno termina cuando empieza otro): no son superposición (AC-42).
- Invitación exactamente a los 15 min 00 s: vencida (AC-56).
- Bloqueo exactamente a los 15 min 00 s del quinto fallo: se libera (AC-17).
- Cupo del grupo: miembros más invitaciones vigentes nunca superan 15 (RF-37).
- Show muy corto en la app: el bloque conserva su alto proporcional; se oculta el horario y luego se trunca el artista con “…” (FR-033).
- Show muy corto en el PNG: se omite el horario y luego se trunca el nombre, sin bajar de los tamaños mínimos (RF-80).
- Gesto ambiguo: tocar, mantener presionado y desplazar no deben interferirse (AC-35, AC-105).
- Hora del dispositivo incorrecta: no afecta los estados temporales (AC-84).
- Cambio de line-up con selecciones existentes: los identificadores son estables; si faltan shows, la importación se rechaza salvo confirmación explícita de eliminación (FR-006).
- Propietario único que quiere salir del grupo: abandonar se rechaza; debe eliminar el grupo explícitamente (FR-050).

## Requirements *(mandatory)*

### Functional Requirements

**Aprovisionamiento**

- **FR-001**: El sistema MUST exponer exactamente un festival ubicado en Argentina, sin catálogo ni selector (RF-01).
- **FR-002**: Los metadatos del festival MUST provenir de configuración de desarrollo; la interfaz solo muestra el nombre del festival en el encabezado y las fechas en el selector de día (RF-02).
- **FR-003**: El line-up MUST cargarse desde un archivo versionado mediante una importación ejecutada por desarrollo, sin interfaz de carga. El archivo tiene las columnas `id,artist,description,day,stage,start,end`; `day` en formato `YYYY-MM-DD`; `start` y `end` en `HH:MM`, hora de `America/Argentina/Buenos_Aires`; el día del festival arranca a las 06:00, por lo que toda hora de inicio o fin menor a 06:00 corresponde al día calendario siguiente (RF-03, AC-107).
- **FR-004**: La importación MUST rechazarse por completo, sin dejar shows cargados de esa ejecución, si algún show tiene vacío o mal formado un campo requerido (id, artista, descripción, día, escenario, inicio, finalización), si su finalización no es posterior a su inicio, si su id está repetido, si su día no pertenece a los días configurados del festival, o si hay más de 5 escenarios distintos (RF-04, RF-79, RNF-06).
- **FR-005**: Cada show MUST pertenecer al día indicado en el line-up aunque termine después de medianoche (RF-71).
- **FR-006**: Los identificadores de show MUST ser estables entre importaciones. Si una reimportación omite shows existentes, MUST rechazarse sin cambios y listar los faltantes; solo una nueva ejecución con confirmación explícita de eliminación MUST eliminarlos junto con sus selecciones.

**Autenticación y cuenta**

- **FR-010**: Las personas MUST poder iniciar sesión con Google o con nombre de usuario y PIN de exactamente 6 dígitos numéricos; son cuentas separadas y una cuenta de Google no tiene PIN (RF-05, RF-06, RNF-08).
- **FR-011**: Ingresar un nombre no registrado y definir su PIN MUST crear la cuenta e iniciar sesión (RF-09).
- **FR-012**: El PIN MUST almacenarse solo en forma irreversible (hash), nunca en texto plano (RF-08, RNF-09).
- **FR-013**: Tras 5 intentos fallidos consecutivos de un usuario, el sistema MUST rechazar todo intento de ese usuario durante 15 minutos, incluso con el PIN correcto; un acceso exitoso reinicia el contador (RNF-10, RNF-11).
- **FR-014**: Un PIN incorrecto y un usuario bloqueado MUST producir respuestas indistinguibles en contenido y sin diferencia sistemática de tiempo de respuesta (RNF-12).
- **FR-015**: El primer acceso con Google MUST exigir un nombre de usuario antes de entrar (RF-11).
- **FR-016**: Los nombres de usuario MUST tener entre 3 y 30 caracteres, solo letras a–z (mayúsculas o minúsculas, sin acentos), dígitos, punto y guion bajo, sin espacios, y ser únicos sin distinguir mayúsculas (RF-12, RF-13).
- **FR-017**: Las personas MUST poder cerrar sesión (RF-10).
- **FR-018**: El sistema MUST NOT ofrecer acceso, registro ni recuperación por email.

**Perfil y descubrimiento**

- **FR-020**: Cada persona MUST poder leer su perfil completo (nombre de usuario, avatar y método de acceso: Google o PIN) y cambiar su nombre de usuario (RF-14, RF-15).
- **FR-021**: El avatar MUST elegirse de 6 formas abstractas (círculo, cuadrado, triángulo, rombo, estrella, hexágono) y de una paleta de 8 colores (violeta, fucsia, rosa, naranja, ámbar, esmeralda, celeste, azul); no hay subida de imágenes. Toda cuenta nueva MUST recibir una forma y un color al azar (RF-16, RF-17).
- **FR-022**: La búsqueda de usuarios por nombre MUST coincidir por comienzo del nombre sin distinguir mayúsculas, exigir al menos 2 caracteres, devolver como máximo 10 resultados, excluir a la propia persona y exponer solo nombre de usuario y avatar (RF-18, RF-19).
- **FR-023**: El sistema MUST impedir leer o modificar el perfil completo de otra persona (RF-70).

**Line-up y detalle**

- **FR-030**: El line-up MUST mostrarse como grilla por día, con selector de día (RF-20, RF-21).
- **FR-031**: La grilla MUST tener una columna por escenario, en orden de aparición en el line-up, y un eje vertical de horario desde el primer inicio hasta el último final del día, ubicando al final los shows posteriores a medianoche (RF-72, RF-77).
- **FR-032**: Cada escenario MUST tener un color distinto de la paleta fija violeta, fucsia, ámbar, esmeralda, celeste (en ese orden), asignado por orden de aparición, usado en su encabezado y sus bloques (RF-22).
- **FR-033**: Cada show MUST mostrarse como un bloque en su columna, en su horario de inicio, con alto proporcional a su duración (misma escala de alto por minuto en todo el día y todas las columnas), indicando artista, inicio y finalización (RF-73). El alto nunca se ajusta al texto: si no entra, primero se oculta el horario y luego se trunca el artista con “…”; el detalle siempre muestra la información completa.
- **FR-034**: La grilla MUST conservar su forma en cualquier tamaño de pantalla y permitir desplazamiento vertical y horizontal cuando no entra (RF-74, RF-75).
- **FR-035**: Un toque corto MUST alternar la selección; mantener presionado al menos 500 ms sin moverse más de 10 px MUST abrir el detalle; un movimiento mayor a 10 px MUST tratarse como desplazamiento sin cambiar la selección. Mantener presionado un bloque MUST abrir el detalle (artista, descripción, día, escenario, inicio, finalización) sin cambiar la selección (RF-23, RF-76).

**Grilla personal**

- **FR-040**: Tocar un bloque MUST alternar su selección; el detalle MUST permitir agregar o quitar el show (RF-24, RF-25).
- **FR-041**: Los bloques seleccionados MUST mostrarse con el color del escenario al 100 % de opacidad, borde de 2 px y marca ✓; los no seleccionados, con el mismo color al 35 % de opacidad y sin borde. La misma regla aplica a "resaltado" y "opacado" en el PNG (RF-26).
- **FR-042**: El sistema MUST advertir los shows seleccionados con intervalos superpuestos (los contiguos no cuentan) y conservar ambas selecciones (RF-27, RF-28).
- **FR-043**: Cada show seleccionado MUST mostrar “próximo” antes de su inicio, “en vivo” desde el inicio hasta antes del final y “finalizado” desde el final, según el instante autoritativo del servidor evaluado en la zona `America/Argentina/Buenos_Aires` (RF-53 a RF-55).
- **FR-044**: Con la grilla abierta, cada cambio de estado temporal MUST verse sin recarga dentro de los 60 s posteriores a su límite; el instante usado MUST derivarse del instante del servidor y resincronizarse al menos cada 5 minutos (RF-56, RNF-02).

**Grupos e invitaciones**

- **FR-050**: Una persona sin grupo MUST poder crear un grupo privado con un nombre de 1 a 40 caracteres (no necesariamente único), quedando como propietaria y miembro; cada persona pertenece a lo sumo a un grupo (RF-29, RF-31). El propietario no puede abandonar el grupo sin transferir antes la propiedad (RF-43); si es el único miembro, tampoco puede abandonarlo: debe eliminar el grupo explícitamente (FR-052).
- **FR-051**: Un grupo MUST tener como máximo 15 miembros, contando las invitaciones vigentes dentro del límite, aun ante invitaciones o aceptaciones simultáneas (RF-30, RF-37).
- **FR-052**: Solo el propietario actual MUST poder renombrar, invitar, cancelar invitaciones, eliminar miembros, transferir la propiedad y eliminar el grupo (RF-32, RF-33, RF-41, RF-42, RF-44).
- **FR-053**: Las invitaciones MUST hacerse solo a usuarios registrados por nombre de usuario, verse dentro de la app y rechazarse si la persona ya pertenece a un grupo. Una persona puede tener invitaciones vigentes de varios grupos; al aceptar una, las demás MUST invalidarse en ese momento y liberar su lugar en el cupo de sus grupos (RF-33, RF-34, RF-35).
- **FR-054**: Una invitación MUST vencer a los 15 minutos de creada; solo su destinatario puede aceptarla o rechazarla mientras está vigente (RF-36, RF-38, RF-39).
- **FR-055**: Un miembro no propietario MUST poder abandonar el grupo y pierde acceso inmediatamente (RF-40).
- **FR-056**: Al eliminar el grupo, todos sus miembros MUST perder el acceso y todas sus invitaciones vigentes MUST invalidarse en el mismo momento, dejando de mostrarse a sus destinatarios y sin poder aceptarse (RF-44).
- **FR-057**: Una invitación MUST ser accesible solo para su destinatario y para el propietario actual del grupo. El propietario MUST ver las invitaciones vigentes con destinatario, estado y vencimiento, y MUST poder cancelarlas; una invitación cancelada deja de estar vigente, desaparece para el destinatario y libera su lugar en el cupo (RF-68, RF-81, RF-37, AC-111, AC-112).

**Vista grupal**

- **FR-060**: La vista grupal MUST mostrar, por show, la cantidad de miembros que lo seleccionaron (RF-45).
- **FR-061**: Un show elegido por al menos 2 miembros MUST marcarse como coincidencia y mostrar los nombres de quienes lo eligieron; con menos de 2 no se muestran nombres (RF-46 a RF-48).
- **FR-062**: La vista grupal MUST ofrecer dos modos: (a) principal, la misma grilla del día (FR-031 a FR-034) con el conteo del grupo en cada bloque, coincidencias marcadas y los shows propios resaltados; (b) una pestaña de lista con los shows del día elegido por al menos un miembro, que se puede ordenar por horario o por cantidad (desempate por inicio ascendente y luego artista) y filtrar para ver solo coincidencias (RF-49 a RF-51). El orden se aplica solo a la lista; la grilla conserva su forma.
- **FR-063**: La vista grupal MUST reflejar las selecciones vigentes al abrirla o al usar "Actualizar"; no se exige actualización en tiempo real (RF-52).

**Exportación**

- **FR-070**: Las personas MUST poder exportar un PNG personal o grupal de un día elegido, en 1080 × 1920 o 1080 × 1350 px. El archivo se llama `grilla-<personal|grupo>-<YYYY-MM-DD>-<formato>.png` y la imagen incluye arriba el nombre del festival, el día y, si es grupal, el nombre del grupo (RF-57, RF-58, RF-62, RF-63).
- **FR-071**: El PNG MUST reproducir la grilla completa del día (todos los escenarios y shows, colores y escala horaria), escalada para entrar completa sin deformarse (todos los bloques y encabezados dentro del lienzo y relación de aspecto de la grilla conservada con tolerancia de ±1 px), con los shows de la persona solicitante resaltados y el resto opacado según FR-041 (RF-57, RF-64, RF-78).
- **FR-072**: En el PNG, el artista MUST verse con al menos 20 px de fuente y el horario con al menos 16 px; si no entran, se omite el horario y luego se trunca el nombre con “…” (RF-80).
- **FR-073**: El PNG grupal MUST mostrar el conteo del grupo solo en los shows resaltados de la persona solicitante (a diferencia de la grilla grupal de la app, que lo muestra en todos los elegidos por algún miembro) e incluir nombres solo si se activa una opción explícita, y nunca para shows con menos de 2 selecciones (RF-59 a RF-61).

**Control de acceso**

- **FR-080**: Todo contenido MUST requerir autenticación (RF-65, RNF-04).
- **FR-081**: Cada grilla personal MUST ser accesible solo para su dueña; cada grupo y vista grupal solo para sus miembros; cada exportación solo para quien la solicitó y, en la grupal, siendo miembro (RF-66, RF-67, RF-69, RNF-05).
- **FR-082**: Toda comunicación MUST usar TLS 1.2 o superior y rechazar versiones anteriores (RNF-07).
- **FR-083**: Una sesión MUST vencer a los 30 días sin uso y renovarse con cada uso (RNF-13).
- **FR-084**: La aplicación MUST funcionar en las 2 últimas versiones de Chrome, Safari iOS y Firefox (RNF-14).
- **FR-085**: El texto MUST cumplir contraste WCAG AA, el foco MUST ser visible y cada bloque MUST ofrecer "Ver detalle" como alternativa a mantener presionado (RNF-15).

**Estados y comportamiento de interfaz**

- **FR-090**: Un día sin shows MUST mostrar "No hay shows este día"; una vista grupal sin selecciones del día MUST mostrar "Nadie del grupo eligió shows este día"; mientras carga MUST mostrarse una grilla esqueleto; ante un error, un mensaje con opción "Reintentar".
- **FR-091**: La grilla MUST abrir por defecto en el día actual del festival (zona `America/Argentina/Buenos_Aires`); antes del festival, en el primer día; después, en el último.
- **FR-092**: La advertencia de superposición MUST mostrarse como un aviso sobre la grilla del día que nombra los shows superpuestos de ese día, y los bloques afectados MUST llevar un ícono ⚠.
- **FR-093**: Los estados temporales MUST mostrarse solo en la grilla personal y en la vista grupal, sobre los shows propios; el PNG no los incluye.
- **FR-094**: Si una persona deja de ser miembro mientras tiene la vista grupal abierta, la siguiente consulta o actualización MUST llevarla a la página de grupo con el mensaje "Ya no sos miembro de este grupo", sin mostrar datos del grupo.
- **FR-095**: Al cambiar el nombre de usuario, las invitaciones y la vista grupal MUST mostrar el nombre nuevo.
- **FR-096**: Si el acceso con Google falla o se cancela, MUST volverse a la página de acceso con el mensaje "No se pudo iniciar sesión con Google" y sin crear cuenta.
- **FR-097**: Con menos de 5 escenarios, las columnas MUST conservar su ancho fijo y la grilla alinearse a la izquierda sin estirarse.

### Key Entities

- **Festival**: único por despliegue, ubicado en Argentina; metadatos provistos por desarrollo; tiene días y escenarios.
- **Escenario**: nombre, orden de aparición y color asignado (máximo 5 por festival).
- **Show**: identificador estable, artista, descripción, día de festival, escenario, inicio y finalización.
- **Persona usuaria**: nombre de usuario único (sin distinguir mayúsculas), método de acceso (Google o PIN), avatar (forma y color), contador de intentos fallidos y bloqueo.
- **Selección**: relación binaria entre una persona y un show.
- **Grupo**: nombre, propietario actual, hasta 15 miembros; cada persona pertenece a lo sumo a uno.
- **Invitación**: grupo, destinatario, momento de creación y estado (vigente, aceptada, rechazada, cancelada, vencida).
- **Exportación**: solicitante, tipo (personal o grupal), día, formato y opción de incluir nombres.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con 150 shows, un grupo de 15 miembros con 30 shows cada uno y 10 personas concurrentes, el 95 % de las consultas de line-up, grilla personal y vista grupal responde en menos de 2 s, medido por operación (RNF-01, AC-97).
- **SC-002**: En las mismas condiciones y con 2 personas concurrentes, el 95 % de las exportaciones PNG se completa en menos de 5 s (RNF-03, AC-96).
- **SC-003**: Cada cambio de estado temporal de un show es visible en una grilla abierta dentro de los 60 s posteriores a su límite (RNF-02).
- **SC-004**: Las pruebas automatizadas registran 0 exposiciones de contenido a personas no autenticadas y 0 exposiciones de recursos privados a personas no autorizadas (RNF-04, RNF-05).
- **SC-005**: Ante cualquier archivo inválido, quedan 0 shows cargados de esa importación (RNF-06).
- **SC-006**: Los datos almacenados contienen 0 PIN en texto plano (RNF-09).
- **SC-007**: El 100 % de los PNG exportados tiene exactamente las dimensiones elegidas y contiene todos los shows del día sin recortes.
- **SC-008**: En una prueba de uso manual con 5 personas antes del festival, al menos 4 encuentran un show, lo agregan a su grilla y ven si coincide con su grupo sin ayuda y en menos de 3 minutos.

## Assumptions

- “Propietario” en RF-32 se refiere al propietario actual, incluso tras una transferencia.
- Solo idioma español y accesibilidad básica (FR-085); sin modo sin conexión ni apps nativas.
- No hay borrado de cuenta ni política de retención de datos en el MVP (exclusión en `PRD2.md`).
- Quien olvida su PIN pierde acceso: la recuperación queda fuera de alcance.
- Dependencias: Google como proveedor de identidad, configuración y archivo de line-up provistos por desarrollo, y un instante UTC confiable del servidor.
- Hosting, herramienta de pruebas de carga y proveedores no acordados quedan fuera de esta spec y se deciden en planificación con el propietario.
- Todo lo listado en “Fuera de Alcance” de `PRD2.md` sigue excluido.
