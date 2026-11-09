---
title: "Yehyecoa"
description: "Un playground de Vue, para uso individual o en grupo."
meaning: "intentar; experimentar; ensayar"
pronunciation: "ye-ye-CÓ-a"
---

Mi propia versión del Vue Playground, hecha originalmente para correr dentro de las lecciones de [Amoxtli Vue](/projects/amoxtli). Quité el selector de versiones y el output compilado, para que quien aprende vea solo su componente ejecutarse en tiempo real. La premisa es la misma: está basado en el component [repl](https://github.com/vuejs/repl) oficial de Vue. Le agregué soporte para la consola y los snapshots. Y algo más...

::media-site{src="https://yehyecoa-vue.ackzell.dev" title="Yehyecoa, el playground de Vue" poster="/media/yehyecoa-vue/site-dark.webp" posterLight="/media/yehyecoa-vue/site-light.webp" posterNarrow="/media/yehyecoa-vue/site-narrow-dark.webp" posterNarrowLight="/media/yehyecoa-vue/site-narrow-light.webp" wide}
Aquí funciona por su cuenta, sin taller al cual unirse. Los snapshots se quedan en tu navegador.
::

Ese algo más es un "salón", lo único que esta página no puede mostrar. En un taller, quien imparte transmite código a través del REPL y el editor de cada estudiante lo sigue en vivo: ediciones, selecciones y desplazamiento incluidos, en el tema que cada quien prefiera.

La idea es que, como instructor, puedas programar en vivo un ejemplo o un concepto que estás tratando de enseñar, y que tus estudiantes vean exactamente lo que haces, pero que también puedan jugar con ese código en su propia máquina cuando quieran, incluso durante la explicación.

Cada intento se puede guardar como un snapshot, compararse con el código actual y restaurarse. Ojalá eso haga que el taller sea algo más inmersivo, y se mantenga fiel al significado del nombre: intentar, experimentar, ensayar.



::media-palette{dir="/media/yehyecoa-vue" width="1440" height="810" label="Funciones de Yehyecoa"}
---
items:
  - id: video
    name: video
    label: Un experimento de video generado con IA para el proyecto.
    caption: Un experimento de video generado con IA para el proyecto.
    video: https://youtu.be/XD68rXTeyMQ
  - id: live-edit
    name: edición en vivo
    label: Un título editado en el editor; la vista previa de al lado se actualiza mientras se escribe.
    caption: Haces un cambio en el editor y la vista previa se actualiza automágicamente.
  - id: console
    name: consola
    label: El botón de la vista previa pulsado tres veces; cada clic deja una línea en la consola de abajo.
    caption: No necesitas abrir las herramientas de desarrollo de tu navegador para ver lo que imprime un console log.
  - id: dock
    name: acomodo
    label: La consola arrastrada por su encabezado sobre el editor y soltada debajo de él, con la vista previa a toda la altura.
    caption: Acomoda los paneles como te sientas más cómodo trabajando. Haz tuyo este espacio.
  - id: broadcast
    name: transmisión
    label: La ventana de quien imparte, transmitiendo. Edita el título y un valor, selecciona una función y baja hasta los estilos.
    caption: Como instructor, puedes transmitir tus cambios en un salón, y cada estudiante conectado seguirá los cambios de código, las selecciones y el desplazamiento.
  - id: follow
    name: seguimiento
    label: La ventana de un estudiante en tema claro, siguiendo a quien imparte. Las mismas ediciones, selecciones y desplazamiento llegan en vivo.
    caption: Como estudiante, puedes seguir los cambios, la selección y el desplazamiento de quien imparte mientras estés conectado al salón. Puedes pausar la conexión y jugar con el código localmente, y al volver a unirte recibirás lo último de la transmisión.
  - id: history
    name: snapshots
    label: El cajón de snapshots abierto, un snapshot comparado lado a lado con el código actual y luego restaurado.
    caption: Un sistema de control de versiones muy sencillo te ayuda a guardar versiones de tus experimentos. Úsalas para comparar con cambios anteriores o para regresar el código al estado que quieras.
  - id: changelog
    name: changelog
    label: La versión del pie de página pulsada, que abre un panel con los cambios de cada versión.
    caption: Entérate de los cambios y correcciones más recientes en el changelog.
---
::


Aquí hay un video que explica las funcionalidades durante un taller, con un pequeño recorrido. (Ten en cuenta que la interfaz puede no verse exactamente igual, pero el comportamiento es el mismo):

::media-video{src="https://youtu.be/I73zTR3OIqQ" title="yehyecoa-vue Live features for #vuejs #playground" poster="/media/yehyecoa-vue/live-features.jpg"}
Un recorrido rápido "durante un taller": la transmisión de quien imparte y cómo cada estudiante sigue la explicación de la lección.
::

::media-stills{dir="/media/yehyecoa-vue/stills" width="1920" height="1080" label="Pantallas de Yehyecoa"}
---
items:
  - src: focus-hero
    alt: El playground en modo oscuro, con la lista de archivos, el editor con App.vue y la vista previa lado a lado.
    caption: "Solo tu componente y lo que muestra. Sin selector de versiones, sin código compilado."
  - src: console-dock-docked
    alt: La consola acomodada debajo del editor, con la vista previa a toda la altura.
    caption: "Acomoda la consola debajo del editor y la vista previa se queda con toda la altura."
  - src: together-instructor-broadcast
    alt: La ventana de quien imparte mientras transmite, con un bloque de estilos seleccionado.
    caption: "Transmitiendo: lo que quien imparte escribe, selecciona o desplaza le llega a todo el salón."
  - src: together-student-light-sync
    alt: La ventana de un estudiante en tema claro, marcada como siguiendo a quien imparte.
    caption: "Un estudiante siguiendo la clase en vivo, en el tema que eligió."
  - src: safety-diff-view
    alt: Una comparación lado a lado entre el código actual y un snapshot guardado, sobre el cajón de snapshots.
    caption: "Compara un snapshot con tu código actual antes de restaurarlo."
  - src: changelog-sheet
    alt: El panel del changelog abierto sobre el playground, con tres versiones beta.
    caption: "Haz clic en la versión del pie de página para ver qué cambió en cada versión."
---
::
