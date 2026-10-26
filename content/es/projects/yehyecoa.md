---
title: "Yehyecoa"
description: "Un playground de Vue enfocado, para ensayar código en grupo."
meaning: "intentar; experimentar; ensayar"
---

Mi propia versión del Vue Playground, hecha para correr dentro de las lecciones de Amoxtli. Deja fuera el selector de versiones y el código compilado, para que quien aprende vea solo su componente y lo que muestra. Está aquí mismo: cambia el código y la vista previa lo sigue.

::media-site{src="https://yehyecoa-vue.ackzell.dev" title="Yehyecoa, el playground de Vue" poster="/media/yehyecoa-vue/site-dark.webp" posterLight="/media/yehyecoa-vue/site-light.webp" posterNarrow="/media/yehyecoa-vue/site-narrow-dark.webp" posterNarrowLight="/media/yehyecoa-vue/site-narrow-light.webp" wide}
Aquí funciona por su cuenta, sin taller al cual unirse. Los snapshots se quedan en tu navegador.
::

Lo que esta página no puede mostrar es el salón. En un taller, quien imparte transmite, y el editor de cada estudiante lo sigue en vivo, con ediciones, selecciones y desplazamiento incluidos, en el tema que cada quien prefiera. Cada intento se puede guardar como snapshot, compararse con el código actual y restaurarse.

::media-palette{dir="/media/yehyecoa-vue" width="1440" height="810" label="Funciones de Yehyecoa"}
---
items:
  - id: promo
    name: promo
    label: El video promocional, sin su música. El nombre se escribe solo y luego aparecen el playground, la sincronización en vivo y los snapshots.
  - id: live-edit
    name: edición en vivo
    label: Un título editado en el editor; la vista previa de al lado se actualiza mientras se escribe.
  - id: console
    name: consola
    label: El botón de la vista previa pulsado tres veces; cada clic deja una línea en la consola de abajo.
  - id: dock
    name: acomodo
    label: La consola arrastrada por su encabezado sobre el editor y soltada debajo de él, con la vista previa a toda la altura.
  - id: broadcast
    name: transmisión
    label: La ventana de quien imparte, transmitiendo. Edita el título y un valor, selecciona una función y baja hasta los estilos.
  - id: follow
    name: seguimiento
    label: La ventana de un estudiante en tema claro, siguiendo a quien imparte. Las mismas ediciones, selecciones y desplazamiento llegan en vivo.
  - id: history
    name: snapshots
    label: El cajón de snapshots abierto, un snapshot comparado lado a lado con el código actual y luego restaurado.
  - id: changelog
    name: changelog
    label: La versión del pie de página pulsada, que abre un panel con los cambios de cada versión.
---
::

::media-stills{dir="/media/yehyecoa-vue/stills" width="1920" height="1080" label="Pantallas de Yehyecoa"}
---
items:
  - src: focus-hero
    alt: El playground en modo oscuro, con la lista de archivos, el editor con App.vue y la vista previa lado a lado.
  - src: console-dock-docked
    alt: La consola acomodada debajo del editor, con la vista previa a toda la altura.
  - src: together-instructor-broadcast
    alt: La ventana de quien imparte mientras transmite, con un bloque de estilos seleccionado.
  - src: together-student-light-sync
    alt: La ventana de un estudiante en tema claro, marcada como siguiendo a quien imparte.
  - src: safety-diff-view
    alt: Una comparación lado a lado entre el código actual y un snapshot guardado, sobre el cajón de snapshots.
  - src: changelog-sheet
    alt: El panel del changelog abierto sobre el playground, con tres versiones beta.
---
::
