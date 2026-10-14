# PRD-001: Festival Social Grid — MVP de grillas personales y grupales

> Versión 2 (borrador auditado). Deriva de `prd.md`, que permanece sin cambios. Los puntos marcados **[PENDIENTE]** requieren respuesta del propietario del producto y no deben tratarse como decisiones.

## Contexto y Problema

Un line-up extenso, con días, horarios y escenarios simultáneos, obliga a asistentes a alternar entre capturas, mensajes y planillas. Esto dificulta descubrir artistas, mantener una agenda propia consistente y reconocer qué shows interesan al grupo.

El MVP concentra esos flujos en una sola aplicación autenticada. No opera festivales ni administra contenidos desde una interfaz: asume que desarrollo aprovisionó datos oficiales y vigentes para el festival del despliegue.

### Resumen del producto

Festival Social Grid es un MVP autenticado para consultar el line-up de un único festival de música de Argentina, planificar una agenda personal y coordinar coincidencias con un grupo privado. Cada despliegue representa exactamente un festival: sus metadatos se configuran por desarrollo y su programación se incorpora mediante un importador CSV versionado ejecutado por desarrollo. Ese aprovisionamiento es operativo y no forma parte de la experiencia de usuarios.

### Personas

- **Asistente:** inicia sesión, consulta el line-up, revisa el detalle de un show, arma su grilla y la exporta.
- **Integrante de grupo:** pertenece a un grupo privado, consulta coincidencias de selección y exporta una vista grupal.
- **Propietario de grupo:** crea el grupo, lo renombra, invita usuarios, elimina miembros, transfiere la propiedad y puede eliminar el grupo.
- **Desarrollador de despliegue:** configura los metadatos del festival e importa el line-up versionado; no es persona usuaria ni dispone de un panel.

### Decisiones de producto

| Tema | Decisión |
|---|---|
| Festival | Un despliegue contiene exactamente un festival ubicado en Argentina. No hay catálogo ni selector. |
| Aprovisionamiento | Configuración e importador CSV son operaciones técnicas; no existe carga, edición ni publicación desde la interfaz. |
| Identidad | Todo el contenido requiere autenticación. Google o nombre de usuario con PIN de 6 dígitos permiten el acceso; son cuentas separadas (una cuenta de Google no tiene PIN). No se usa email para el acceso. El perfil completo es privado; el descubrimiento expone solo nombre de usuario y avatar. |
| Avatar | Se elige de un set de formas abstractas y se le puede cambiar el color. No hay subida de archivos. |
| Selección | Binaria: un usuario selecciona un show o no. |
| Grupos | Privados, máximo 15 miembros incluido el propietario. Una persona pertenece como máximo a un grupo. El propietario puede renombrarlo y eliminarlo. |
| Invitaciones | Solo por nombre de usuario (no por email), visibles dentro de la app, vigentes 15 minutos. Las vigentes cuentan para el límite de 15. |
| Coincidencia | Existe solo cuando al menos dos miembros seleccionaron el mismo show. |
| Día del show | Cada show pertenece al día de festival indicado en el CSV, aunque termine después de medianoche (ej.: un show del sábado a la 1 am del domingo pertenece al sábado). |
| Tiempo | El servidor entrega el instante UTC autoritativo; la comparación usa la zona IANA fija `America/Argentina/Buenos_Aires`. No se usa la hora del dispositivo ni la zona local del servidor. |
| Exportación | PNG personal y grupal en dos formatos fijos. La grupal parte de los shows de quien la solicita, incorpora conteos y puede incluir nombres. Cada PNG corresponde a un día elegido antes de descargar y lo muestra como timeline de doble entrada (horario × escenario). No hay máximo de shows: se muestra la grilla completa de ese día. |
| Objetivos | Cualitativos (sin métricas de adopción, por no haber analítica). |

## Objetivos

- Permitir que una persona autenticada encuentre shows del line-up y construya una agenda personal ordenada.
- Hacer visibles las superposiciones entre shows seleccionados sin impedir la elección de la persona.
- Permitir que los integrantes de un grupo privado identifiquen automáticamente los shows elegidos por al menos dos integrantes.
- Mostrar estados temporales correctos para los shows de una grilla abierta usando una referencia horaria autoritativa.
- Permitir compartir una representación legible de la grilla personal o grupal mediante PNG.

## Requerimientos Funcionales

### Aprovisionamiento
- **RF-01:** El sistema debe exponer exactamente un festival de Argentina.
- **RF-02:** El sistema debe leer los metadatos del festival desde configuración de desarrollo.
- **RF-03:** El importador debe cargar el line-up desde un CSV versionado ejecutado por desarrollo.
- **RF-04:** El importador debe rechazar la carga completa cuando un campo requerido de algún show es inválido. Campos requeridos: id, artista, descripción, día, escenario, inicio y finalización.
- **RF-71:** El sistema debe asignar cada show al día de festival indicado en el CSV, aunque su finalización ocurra después de medianoche.

### Autenticación y cuenta
- **RF-05:** El sistema debe permitir iniciar sesión mediante Google.
- **RF-06:** El sistema debe permitir iniciar sesión con nombre de usuario y PIN de exactamente 6 dígitos numéricos.
- **RF-07:** El sistema debe iniciar sesión cuando el PIN ingresado coincide con el de un nombre de usuario registrado.
- **RF-08:** El sistema debe almacenar el PIN solo como hash; nunca en texto plano.
- **RF-09:** El sistema debe crear la cuenta e iniciar sesión cuando se ingresa un nombre de usuario no registrado y se define su PIN.
- **RF-10:** El sistema debe permitir cerrar sesión.
- **RF-11:** El sistema debe solicitar un nombre de usuario en el primer acceso con Google.
- **RF-12:** El sistema debe aceptar solo nombres de usuario de entre 3 y 30 caracteres.
- **RF-13:** El sistema debe rechazar un nombre de usuario ya existente sin distinguir mayúsculas de minúsculas.

### Perfil y descubrimiento
- **RF-14:** El sistema debe permitir a cada persona leer su perfil completo.
- **RF-15:** El sistema debe permitir a cada persona modificar su nombre de usuario.
- **RF-16:** El sistema debe permitir elegir el avatar entre un set de formas abstractas.
- **RF-17:** El sistema debe permitir cambiar el color del avatar entre una paleta fija de 8 colores de la aplicación (violeta, fucsia, rosa, naranja, ámbar, esmeralda, celeste y azul).
- **RF-18:** El sistema debe permitir a usuarios autenticados buscar usuarios por nombre de usuario.
- **RF-19:** La búsqueda de usuarios debe exponer solo nombre de usuario y avatar.
- **RF-70:** El sistema debe impedir que una persona lea o modifique el perfil completo de otra.

### Line-up y detalle
- **RF-20:** El sistema debe mostrar el line-up a personas autenticadas.
- **RF-21:** El sistema debe permitir filtrar el line-up por día.
- **RF-22:** El sistema debe permitir filtrar el line-up por escenario.
- **RF-23:** El sistema debe mostrar el detalle de un show: artista, descripción, día, escenario, inicio y finalización.

### Grilla personal
- **RF-24:** El sistema debe permitir agregar un show a la grilla personal desde el line-up o el detalle.
- **RF-25:** El sistema debe permitir quitar un show de la grilla personal desde el line-up o el detalle.
- **RF-26:** El sistema debe agrupar por día los shows seleccionados.
- **RF-27:** El sistema debe advertir los intervalos superpuestos entre shows seleccionados.
- **RF-28:** El sistema debe conservar las selecciones superpuestas.

### Grupos e invitaciones
- **RF-29:** El sistema debe permitir crear un grupo privado con nombre, del cual la persona creadora es propietaria y miembro. **[PENDIENTE: largo máximo y unicidad del nombre]**
- **RF-30:** El sistema debe limitar cada grupo a 15 miembros, incluido el propietario.
- **RF-31:** El sistema debe limitar a una persona a pertenecer como máximo a un grupo.
- **RF-32:** El propietario debe poder renombrar el grupo. **[PENDIENTE: ¿“creador” o “propietario” actual tras una transferencia?]**
- **RF-33:** El propietario debe poder invitar a un usuario registrado por nombre de usuario.
- **RF-34:** El sistema debe rechazar la invitación a una persona que ya pertenece a un grupo.
- **RF-35:** El sistema debe mostrar a la persona invitada la invitación dentro de la app.
- **RF-36:** El sistema debe invalidar una invitación 15 minutos después de su creación.
- **RF-37:** El sistema debe contar las invitaciones vigentes dentro del límite de 15 del grupo.
- **RF-38:** La persona invitada debe poder aceptar una invitación vigente.
- **RF-39:** La persona invitada debe poder rechazar una invitación vigente.
- **RF-40:** Un miembro no propietario debe poder abandonar el grupo.
- **RF-41:** El propietario debe poder eliminar miembros del grupo.
- **RF-42:** El propietario debe poder transferir la propiedad a otro miembro.
- **RF-43:** El sistema debe rechazar que el propietario abandone el grupo sin haber transferido la propiedad. **[PENDIENTE: ¿el propietario único también debe eliminar el grupo en lugar de salir?]**
- **RF-44:** El propietario debe poder eliminar el grupo. **[PENDIENTE: efecto sobre invitaciones vigentes]**

### Vista grupal
- **RF-45:** El sistema debe calcular, para cada show, la cantidad de miembros del grupo que lo seleccionaron.
- **RF-46:** El sistema debe mostrar a miembros del grupo los nombres de usuario de quienes seleccionaron un show elegido por al menos dos miembros.
- **RF-47:** El sistema debe ocultar los nombres de usuario de un show elegido por menos de dos miembros del grupo.
- **RF-48:** El sistema debe marcar como coincidencia grupal un show seleccionado por al menos dos miembros.
- **RF-49:** La vista grupal debe permitir ordenar por horario.
- **RF-50:** La vista grupal debe permitir ordenar por cantidad de personas interesadas.
- **RF-51:** La vista grupal debe permitir un filtro que oculte los shows seleccionados por menos de dos miembros.
- **RF-52:** La vista grupal debe reflejar las selecciones vigentes de los miembros al consultarla o actualizarla.

### Estado temporal
- **RF-53:** El sistema debe mostrar “próximo” en un show seleccionado cuando el instante UTC autoritativo del servidor es anterior a su inicio.
- **RF-54:** El sistema debe mostrar “en vivo” cuando ese instante es mayor o igual al inicio y estrictamente anterior al final.
- **RF-55:** El sistema debe mostrar “finalizado” cuando ese instante es mayor o igual al final.
- **RF-56:** El sistema debe actualizar los estados temporales de una grilla abierta sin recarga manual (plazo en RNF-02).

### Exportación
- **RF-57:** El sistema debe generar un PNG de la grilla personal de un día elegido, con solo los shows seleccionados de ese día, en un timeline de doble entrada (horario × escenario) con todos los escenarios como columnas.
- **RF-58:** El sistema debe generar un PNG grupal con los shows seleccionados por la persona solicitante.
- **RF-59:** El PNG grupal debe incluir, para cada show, el conteo de miembros del grupo que también lo seleccionaron.
- **RF-60:** El sistema debe ofrecer en la exportación grupal una opción explícita para incluir nombres de usuario.
- **RF-61:** El PNG grupal no debe mostrar nombres de un show seleccionado por menos de dos miembros, aun con la opción activada.
- **RF-62:** El sistema debe ofrecer exportación en 1080 × 1920 px.
- **RF-63:** El sistema debe ofrecer exportación en 1080 × 1350 px.
- **RF-64:** El PNG debe incluir todos los shows seleccionados del día exportado, sin tope de cantidad.

### Autenticación y autorización del contenido
- **RF-65:** El sistema debe requerir autenticación para todo contenido, incluidos line-up y detalle.
- **RF-66:** El sistema debe permitir acceder a una grilla personal solo a su propietaria.
- **RF-67:** El sistema debe permitir acceder a un grupo y su vista grupal solo a sus miembros.
- **RF-68:** El sistema debe permitir acceder a una invitación solo a su destinatario y al propietario del grupo. **[PENDIENTE: confirmar que el propietario puede verlas]**
- **RF-69:** El sistema debe permitir acceder a una exportación solo a quien la solicitó y, en la grupal, siendo miembro del grupo.

## Requerimientos No Funcionales

- **RNF-01 — Rendimiento de consultas:** Referencia: ejecutor Linux de CI con 2 vCPU y 4 GB de RAM, aplicación y base de prueba en el mismo ejecutor. *Fixture*: exactamente 150 shows y un grupo de exactamente 15 miembros con 30 shows seleccionados por miembro. Tras 30 solicitudes de calentamiento por operación, se ejecutan 300 solicitudes medidas (100 de line-up, 100 de grilla personal, 100 de vista grupal) con exactamente 10 usuarios autenticados concurrentes. En la frontera de la API, el p95 de cada operación debe ser inferior a 2 s.
- **RNF-02 — Actualización temporal:** Con una grilla abierta, cada transición de estado debe ser visible dentro de los 60 s posteriores a su límite horario.
- **RNF-03 — Generación de PNG:** Mismo ejecutor y *fixture* que RNF-01; la persona solicitante tiene 30 shows en 3 días. Tras 5 exportaciones de calentamiento por cada combinación (personal/grupal × 1080 × 1920/1080 × 1350), se ejecutan 100 exportaciones medidas (25 por combinación) con exactamente 2 usuarios concurrentes. En la frontera de la API, el p95 del conjunto debe ser inferior a 5 s.
- **RNF-04 — Privacidad (no autenticados):** Las pruebas automatizadas deben registrar 0 exposiciones de contenido a personas no autenticadas, incluidas las URL de exportación.
- **RNF-05 — Privacidad (recursos ajenos):** Las pruebas automatizadas deben registrar 0 exposiciones de recursos privados (grilla, grupo, invitación, exportación, perfil completo) a personas no autorizadas, al intentar leer, modificar o exportar.
- **RNF-06 — Integridad del aprovisionamiento:** Ante datos inválidos, el importador debe dejar 0 shows cargados de esa ejecución.
- **RNF-07 — TLS:** Toda comunicación debe usar TLS 1.2 o superior; un handshake con TLS 1.1 o inferior debe ser rechazado.
- **RNF-08 — Formato del PIN:** El sistema debe rechazar todo PIN que no tenga exactamente 6 dígitos numéricos.
- **RNF-09 — Almacenamiento del PIN:** La base de datos debe contener 0 PIN en texto plano.
- **RNF-10 — Bloqueo por intentos fallidos:** Tras 5 intentos fallidos consecutivos para un nombre de usuario, el sistema debe rechazar todo intento de ese usuario, incluso con el PIN correcto, durante 15 minutos.
- **RNF-11 — Reinicio del contador:** Un inicio de sesión exitoso debe reiniciar a 0 el contador de intentos fallidos.
- **RNF-12 — Respuesta uniforme de error:** Un PIN incorrecto y un usuario bloqueado deben devolver el mismo código HTTP y el mismo cuerpo.

## Criterios de Aceptación

### Aprovisionamiento
- **AC-01 (RF-01, RF-02, RF-03):** Dado un despliegue con metadatos de un festival argentino y un CSV válido, cuando desarrollo ejecuta el importador, entonces queda disponible exactamente 1 festival con todos los shows del CSV.
- **AC-02 (RF-01):** Dado el festival aprovisionado, cuando una persona recorre la interfaz, entonces encuentra 0 elementos de elección o gestión de festivales.
- **AC-03 (RF-04, RNF-06):** Dado un CSV con un show sin escenario, cuando desarrollo ejecuta el importador, entonces el proceso falla y quedan 0 shows de esa ejecución en la base.
- **AC-04 (RF-71):** Dado un show del día sábado que termina a la 1:00 del domingo en el CSV, cuando se filtra por sábado, entonces el show aparece y no aparece al filtrar por domingo.

### Autenticación
- **AC-05 (RF-05):** Dada una persona sin sesión con cuenta de Google válida, cuando autoriza el acceso, entonces inicia sesión.
- **AC-06 (RF-06, RNF-08):** Dado el formulario de acceso, cuando se ingresa un PIN de 5 dígitos, de 7 dígitos o con letras, entonces se rechaza; con 6 dígitos numéricos se acepta el formato.
- **AC-07 (RF-09, RF-12, RF-13):** Dado un nombre de usuario no registrado y válido, cuando la persona define un PIN de 6 dígitos, entonces se crea su cuenta con ese nombre de usuario y se inicia la sesión sin pedir otro nombre.
- **AC-08 (RF-07):** Dado un nombre de usuario registrado, cuando su titular ingresa el PIN correcto, entonces inicia sesión sin crear una cuenta duplicada; con “aNA” inicia sesión la cuenta “Ana”.
- **AC-09 (RF-07):** Dado un nombre de usuario registrado, cuando se ingresa un PIN incorrecto, entonces se rechaza y no se inicia sesión.
- **AC-20 (RF-08, RNF-09):** Dada una cuenta con PIN, cuando se inspecciona la base de datos, entonces el PIN no aparece en texto plano.
- **AC-21 (RF-05, RF-06):** Dada una cuenta creada con Google, cuando se intenta acceder con su nombre de usuario y cualquier PIN, entonces se rechaza.
- **AC-10 (RF-10):** Dada una persona con sesión, cuando cierra sesión, entonces una solicitud posterior de contenido autenticado es denegada.
- **AC-11 (RF-11):** Dada una persona en su primer acceso sin nombre de usuario, cuando intenta entrar a la aplicación, entonces se le solicita un nombre de usuario y no accede hasta fijarlo.
- **AC-12 (RF-12):** Dado un nombre de usuario de 3 caracteres, cuando se guarda, entonces se acepta; ídem con 30 caracteres.
- **AC-13 (RF-12):** Dado un nombre de usuario de 2 caracteres, cuando se guarda, entonces se rechaza; ídem con 31 caracteres.
- **AC-14 (RF-13):** Dado un nombre de usuario existente “Ana”, cuando otra persona guarda “aNA”, entonces se rechaza.
- **AC-15 (RNF-10):** Dado un usuario con 4 intentos fallidos consecutivos, cuando ingresa el PIN correcto, entonces inicia sesión.
- **AC-16 (RNF-10):** Dado un usuario con 5 intentos fallidos consecutivos, cuando ingresa el PIN correcto antes de 15 min 00 s del quinto fallo, entonces se rechaza.
- **AC-17 (RNF-10):** Dado un usuario bloqueado, cuando ingresa el PIN correcto a los 15 min 00 s del quinto fallo, entonces inicia sesión.
- **AC-18 (RNF-11):** Dado un usuario con 4 intentos fallidos, cuando inicia sesión con éxito y luego falla 4 veces más, entonces el siguiente intento con PIN correcto se acepta.
- **AC-19 (RNF-12):** Dados un PIN incorrecto y un usuario bloqueado, cuando se intenta acceder, entonces ambas respuestas tienen el mismo código HTTP y el mismo cuerpo.
- **AC-22 (RNF-07):** Dado el endpoint público, cuando un cliente intenta un handshake TLS 1.1, entonces se rechaza; con TLS 1.2 se acepta.

### Perfil y descubrimiento
- **AC-23 (RF-14):** Dada una persona autenticada, cuando consulta su perfil, entonces ve su perfil completo.
- **AC-24 (RF-15):** Dada una persona autenticada, cuando cambia su nombre de usuario por uno disponible, entonces el perfil muestra el nuevo nombre.
- **AC-25 (RF-16):** Dada una persona autenticada, cuando elige una forma del set como avatar, entonces su perfil muestra esa forma.
- **AC-26 (RF-17):** Dada una persona con avatar, cuando cambia su color, entonces el avatar se muestra con el nuevo color.
- **AC-27 (RF-18):** Dada una persona autenticada, cuando busca “an”, entonces obtiene los usuarios cuyo nombre de usuario coincide.
- **AC-28 (RF-19):** Dada una búsqueda de usuarios, cuando se examina cada resultado, entonces contiene exactamente 2 campos: nombre de usuario y avatar.
- **AC-29 (RF-70, RNF-05):** Dada una persona autenticada A y otra cuenta B, cuando A intenta leer el perfil completo de B, entonces se deniega.
- **AC-30 (RF-70, RNF-05):** Dadas A y B, cuando A intenta modificar el perfil de B, entonces se deniega y el perfil de B no cambia.

### Line-up y detalle
- **AC-31 (RF-20):** Dada una persona autenticada, cuando abre el line-up, entonces ve todos los shows del festival.
- **AC-32 (RF-21):** Dado un filtro de día activo, cuando se consulta, entonces solo aparecen shows de ese día.
- **AC-33 (RF-22):** Dado un filtro de escenario activo, cuando se consulta, entonces solo aparecen shows de ese escenario.
- **AC-34 (RF-21, RF-22):** Dados ambos filtros activos, cuando se consulta, entonces solo aparecen shows que cumplen los dos.
- **AC-35 (RF-23):** Dado un show, cuando se abre su detalle, entonces se muestran artista, descripción, día, escenario, inicio y finalización.

### Grilla personal
- **AC-36 (RF-24):** Dado un show no seleccionado, cuando se agrega desde el line-up, entonces aparece en la grilla.
- **AC-37 (RF-24):** Dado un show no seleccionado, cuando se agrega desde el detalle, entonces aparece en la grilla.
- **AC-38 (RF-25):** Dado un show seleccionado, cuando se quita desde el line-up, entonces deja de aparecer en la grilla y las selecciones de otras personas no cambian.
- **AC-39 (RF-25):** Dado un show seleccionado, cuando se quita desde el detalle, entonces deja de aparecer en la grilla y las selecciones de otras personas no cambian.
- **AC-40 (RF-26):** Dada una grilla con 2 shows del día 1 y 1 del día 2, cuando se consulta, entonces se muestran 2 secciones de día con 2 y 1 shows.
- **AC-41 (RF-27):** Dados dos shows seleccionados con intervalos solapados, cuando se consulta la grilla, entonces se muestra una advertencia que nombra a ambos.
- **AC-42 (RF-27):** Dados dos shows donde uno termina exactamente cuando empieza el otro, cuando se consulta la grilla, entonces no se muestra advertencia.
- **AC-43 (RF-28):** Dados dos shows solapados, cuando se agrega el segundo, entonces ambos permanecen seleccionados.

### Grupos e invitaciones
- **AC-44 (RF-29):** Dada una persona sin grupo, cuando crea un grupo con nombre, entonces figura como propietaria y miembro.
- **AC-45 (RF-30):** Dado un grupo con 14 miembros y 0 invitaciones vigentes, cuando se acepta una invitación, entonces el grupo queda con 15 miembros.
- **AC-46 (RF-30):** Dado un grupo con 15 miembros, cuando el propietario intenta invitar a otra persona, entonces se rechaza.
- **AC-47 (RF-31):** Dada una persona miembro de un grupo, cuando intenta crear otro grupo, entonces se rechaza.
- **AC-48 (RF-32):** Dado el propietario, cuando renombra el grupo, entonces el grupo muestra el nuevo nombre.
- **AC-49 (RF-32, RNF-05):** Dado un miembro no propietario, cuando intenta renombrar el grupo, entonces se rechaza.
- **AC-50 (RF-33):** Dado un usuario registrado sin grupo, cuando el propietario lo invita por nombre de usuario, entonces el usuario ve la invitación en la app.
- **AC-51 (RF-33):** Dado el formulario de invitación, cuando se inspeccionan sus opciones, entonces no existe invitación por email.
- **AC-52 (RF-33, RNF-05):** Dado un miembro no propietario, cuando intenta invitar, entonces se rechaza.
- **AC-53 (RF-34):** Dado un usuario que ya pertenece a un grupo, cuando el propietario de otro grupo lo invita, entonces se rechaza.
- **AC-54 (RF-35):** Dada una invitación vigente, cuando el destinatario abre la app, entonces la ve listada.
- **AC-55 (RF-36):** Dada una invitación de 14 min 59 s, cuando se acepta, entonces se acepta.
- **AC-56 (RF-36):** Dada una invitación de 15 min 00 s, cuando se acepta, entonces se rechaza.
- **AC-57 (RF-37):** Dado un grupo con 14 miembros y 1 invitación vigente, cuando el propietario intenta otra invitación, entonces se rechaza.
- **AC-58 (RF-37):** Dado un grupo con 14 miembros y 1 invitación vencida, cuando el propietario invita a otra persona, entonces se acepta.
- **AC-59 (RF-38):** Dada una invitación vigente, cuando el destinatario la acepta, entonces ingresa al grupo.
- **AC-60 (RF-39):** Dada una invitación vigente, cuando el destinatario la rechaza, entonces no ingresa y la invitación deja de estar vigente.
- **AC-61 (RF-40):** Dado un miembro no propietario, cuando abandona el grupo, entonces deja de ser miembro y pierde el acceso.
- **AC-62 (RF-41):** Dado un grupo con varios miembros, cuando el propietario elimina a uno, entonces esa persona pierde el acceso.
- **AC-63 (RF-41, RNF-05):** Dado un miembro no propietario, cuando intenta eliminar a otro, entonces se rechaza.
- **AC-64 (RF-42):** Dado un grupo con varios miembros, cuando el propietario transfiere la propiedad a otro, entonces ese miembro figura como propietario y el anterior como miembro ordinario.
- **AC-65 (RF-42, RNF-05):** Dado un miembro no propietario, cuando intenta transferir la propiedad, entonces se rechaza.
- **AC-66 (RF-43):** Dado un propietario sin transferencia previa, cuando intenta abandonar el grupo, entonces se rechaza.
- **AC-67 (RF-44):** Dado un propietario, cuando elimina el grupo, entonces el grupo deja de existir y todos sus miembros pierden el acceso.
- **AC-68 (RF-44, RNF-05):** Dado un miembro no propietario, cuando intenta eliminar el grupo, entonces se rechaza.
- **AC-69 (RF-38, RF-39, RNF-05):** Dada una invitación dirigida a A, cuando B (otra persona) intenta aceptarla o rechazarla, entonces se rechaza.

### Vista grupal
- **AC-70 (RF-45):** Dado un grupo donde 3 miembros seleccionaron el show X, cuando un miembro consulta la vista grupal, entonces X muestra conteo 3.
- **AC-71 (RF-46):** Dado un show seleccionado por 2 miembros, cuando un miembro consulta la vista grupal, entonces ve los nombres de usuario de esos 2.
- **AC-72 (RF-47):** Dado un show seleccionado por 1 miembro, cuando un miembro consulta la vista grupal, entonces no ve ningún nombre de usuario para ese show.
- **AC-73 (RF-48):** Dado un show con conteo 2, cuando se consulta la vista grupal, entonces está marcado como coincidencia.
- **AC-74 (RF-48):** Dado un show con conteo 1, cuando se consulta la vista grupal, entonces no está marcado como coincidencia.
- **AC-75 (RF-49):** Dada una vista grupal, cuando se ordena por horario, entonces los shows aparecen en orden ascendente de inicio.
- **AC-76 (RF-50):** Dada una vista grupal, cuando se ordena por cantidad, entonces los shows aparecen en orden descendente de conteo. **[PENDIENTE: criterio de desempate]**
- **AC-77 (RF-51):** Dada una vista grupal con shows de conteo 1 y 2, cuando se activa el filtro, entonces solo se ven los de conteo mayor o igual a 2.
- **AC-78 (RF-52):** Dado un miembro que agrega o quita un show, cuando otro miembro consulta la vista grupal, entonces el conteo refleja el cambio (y los nombres, solo si el conteo es mayor o igual a 2). **[PENDIENTE: plazo de actualización]**
- **AC-79 (RF-45, RF-46, RF-47, RNF-05):** Dado un grupo G, cuando un miembro de otro grupo o una persona sin grupo consulta la vista grupal de G, entonces se deniega sin exponer conteos ni nombres.

### Estado temporal
- **AC-80 (RF-53):** Dado un show seleccionado, cuando el instante autoritativo es 1 ms antes del inicio, entonces se muestra “próximo”.
- **AC-81 (RF-54):** Dado un show seleccionado, cuando el instante es exactamente el inicio, entonces se muestra “en vivo”.
- **AC-82 (RF-54):** Dado un show seleccionado, cuando el instante es 1 ms antes del final, entonces se muestra “en vivo”.
- **AC-83 (RF-55):** Dado un show seleccionado, cuando el instante es exactamente el final, entonces se muestra “finalizado”.
- **AC-84 (RF-53, RF-54, RF-55):** Dado un dispositivo con hora distinta a la del servidor, cuando se consulta el estado, entonces el resultado coincide con el calculado con el instante del servidor.
- **AC-85 (RF-56, RNF-02):** Dada una grilla abierta, cuando transcurren 60 s desde el inicio de un show, entonces el estado visible es “en vivo” sin recarga.
- **AC-86 (RF-56, RNF-02):** Dada una grilla abierta, cuando transcurren 60 s desde el final de un show, entonces el estado visible es “finalizado” sin recarga.

### Exportación
- **AC-87 (RF-57, RF-62):** Dada una grilla personal, cuando se exporta en 1080 × 1920, entonces se descarga un PNG de exactamente 1080 × 1920 px.
- **AC-88 (RF-57, RF-63):** Dada una grilla personal, cuando se exporta en 1080 × 1350, entonces se descarga un PNG de exactamente 1080 × 1350 px.
- **AC-89 (RF-57):** Dada una grilla con 2 shows seleccionados del día 1 y 1 del día 2, cuando se exporta el día 1, entonces el PNG contiene exactamente esos 2 shows, ubicados en la columna de su escenario y en su franja horaria.
- **AC-90 (RF-58, RF-62, RF-63):** Dado un miembro de un grupo, cuando solicita la exportación grupal en cada formato, entonces el PNG tiene exactamente las dimensiones elegidas y contiene solo los shows que él seleccionó.
- **AC-91 (RF-59):** Dado un show seleccionado por el solicitante y otros 2 miembros, cuando se genera el PNG grupal, entonces el show muestra conteo 3.
- **AC-92 (RF-60, RF-61):** Dada una exportación grupal con nombres activados, cuando un show fue seleccionado por 2 miembros, entonces el PNG muestra sus nombres de usuario.
- **AC-93 (RF-61):** Dada una exportación grupal con nombres activados, cuando un show fue seleccionado por 1 miembro, entonces el PNG no muestra nombres para ese show.
- **AC-94 (RF-60):** Dada una exportación grupal sin activar nombres, cuando un show fue seleccionado por 3 miembros, entonces el PNG no muestra ningún nombre.
- **AC-95 (RF-64):** Dada una grilla con 10 shows en un mismo día, cuando se exporta ese día, entonces el PNG incluye los 10 shows.
- **AC-96 (RNF-03):** Dado el *fixture* y las condiciones de RNF-03, cuando se miden las 100 exportaciones, entonces el p95 es inferior a 5 s.
- **AC-97 (RNF-01):** Dado el *fixture* y las condiciones de RNF-01, cuando se miden las solicitudes de line-up, grilla personal y vista grupal, entonces el p95 de cada operación es inferior a 2 s.

### Control de acceso
- **AC-98 (RF-65, RNF-04):** Dada una persona no autenticada, cuando intenta acceder al line-up o al detalle de un show, entonces se deniega sin exponer contenido.
- **AC-99 (RF-65, RF-66, RNF-04):** Dada una persona no autenticada, cuando intenta acceder a una grilla, grupo o invitación, entonces se deniega sin exponer contenido.
- **AC-100 (RF-69, RNF-04):** Dada una persona no autenticada, cuando solicita la URL de una exportación, entonces se deniega.
- **AC-101 (RF-66, RNF-05):** Dadas A y B autenticadas, cuando A intenta leer la grilla personal de B, entonces se deniega.
- **AC-102 (RF-67, RNF-05):** Dada una persona ajena al grupo G, cuando intenta leer o modificar G, entonces se deniega.
- **AC-103 (RF-68, RNF-05):** Dada una invitación dirigida a A, cuando una persona ajena (no destinataria ni propietaria del grupo) intenta leerla, entonces se deniega.
- **AC-104 (RF-69, RNF-05):** Dada una exportación grupal de G, cuando una persona ajena a G intenta generarla o descargarla, entonces se deniega.

## Fuera de Alcance

- Herramientas administrativas, panel administrativo y cuentas administrativas.
- CRUD de festivales, catálogo de festivales o elección entre múltiples festivales.
- Festivales fuera de Argentina.
- Carga manual de shows, interfaz de carga CSV, edición de CSV desde la aplicación o cualquier ingreso de line-up por usuarios.
- OCR, IA o extracción de programación a partir de imágenes.
- Borradores, flujos de revisión o publicación y versionado de festivales o line-ups visibles.
- Analítica de producto, métricas de adopción, telemetría de comportamiento o recomendaciones basadas en uso.
- Compra, reventa, validación o almacenamiento de entradas.
- Mensajería, chat, comentarios, publicaciones, reacciones o feed social.
- Votaciones grupales, grilla grupal editable o resolución automática de superposiciones.
- Estados de preferencia como “quizá”, prioridades o rankings de artistas.
- Perfiles o enlaces expuestos sin autenticación, acceso anónimo a recursos privados o notificaciones fuera de una grilla abierta.
- Acceso o registro por email, recuperación o restablecimiento de PIN olvidado y vinculación de una cuenta de Google con un PIN.
- Invitaciones por email, invitaciones a personas no registradas y notificaciones de invitación fuera de la app.
- Pertenecer a más de un grupo simultáneamente.
- Subida de imágenes o fotos como avatar.
- Idiomas distintos al español.
- Accesibilidad más allá de la básica.
- Modo sin conexión, mapas del predio, geolocalización, rutas entre escenarios, calendarios externos o aplicaciones móviles nativas.

## Riesgos y Dependencias

| Tipo | Descripción | Mitigación o condición |
|---|---|---|
| Riesgo | El CSV puede contener horarios, escenarios o artistas erróneos. | Validar el esquema antes de la carga y versionar el archivo (RF-04, RNF-06). |
| Riesgo | Un cambio del line-up puede volver inconsistentes selecciones existentes. | Identificadores estables, evaluar impacto en el importador y no reasignar selecciones automáticamente. |
| Riesgo | La privacidad puede vulnerarse por accesos directos a recursos ajenos. | Autorización del lado del servidor y pruebas de acceso cruzado (RNF-04, RNF-05). |
| Riesgo | Incluir nombres de terceros en un PNG facilita compartirlos fuera del grupo. | Conteos sin nombres por defecto y elección explícita para incluirlos (RF-60). |
| Riesgo | Sin tope de shows (RF-64), una grilla extensa puede no ser legible en tamaños PNG fijos. | Mitigado: un PNG por día en formato timeline, donde cada show ocupa el alto proporcional a su duración; no hay RNF que verifique la legibilidad. |
| Riesgo | Un reloj de cliente o zona local incorrectos pueden inducir estados erróneos. | Usar solo el instante UTC del servidor y `America/Argentina/Buenos_Aires`. |
| Riesgo | La enumeración de usuarios por búsqueda de nombre de usuario sigue siendo posible. | Aceptado: la búsqueda es parte del producto y solo expone nombre de usuario y avatar (RF-19). |
| Dependencia | Desarrollo debe mantener la configuración de metadatos del festival único. | Disponible antes del despliegue. |
| Dependencia | Desarrollo debe disponer de un CSV versionado y un importador. | Se ejecuta como parte del aprovisionamiento, fuera de la interfaz. |
| Riesgo | Un PIN de 6 dígitos admite solo 10⁶ combinaciones y es vulnerable a fuerza bruta. | Bloqueo de 15 min tras 5 fallos por usuario (RNF-10) y PIN guardado como hash (RNF-09). |
| Riesgo | El flujo de acceso revela si un nombre de usuario existe (pide PIN o lo crea). | Aceptado: los nombres de usuario ya son descubribles por búsqueda (RF-18, RF-19). |
| Riesgo | Quien olvida su PIN pierde el acceso a su cuenta. | Aceptado para el MVP: la recuperación está fuera de alcance. |
| Dependencia | Se requiere Google OAuth. | Acceso por Google o por nombre de usuario único con PIN de seis dígitos. |
| Dependencia | El servidor debe entregar un instante UTC confiable. | La interfaz lo recibe y evalúa estados con `America/Argentina/Buenos_Aires`. |
| Dependencia | El motor de imágenes debe renderizar PNG consistentes. | Debe soportar exactamente 1080 × 1920 y 1080 × 1350 dentro de RNF-03. |
