---
title: "Amoxtli Vue"
description: "Una plataforma interactiva y multimedia para aprender Vue: texto, video y componentes interactivos."
meaning: "libro"
pronunciation: "a-MÓSH-tli"
---


El sucesor espiritual de [Notes On Vue](https://notes-on-vue.ackzell.dev).

Este es un proyecto que he tenido muchas ganas de hacer por mucho tiempo. Después de obtener cierta experiencia con Vue, quise crear un curso y eso significaba crear el material y las herramientas de apoyo para el mismo, así que primero iteré en ese proyecto antes mencionado: Notes on Vue que ya tenía video, texto y snippets de código, pero lo que realmente quería crear era una plataforma donde la interactividad fuera la manera principal de navegarla y también pues que permitiera a diferentes estilos de aprendizaje aprovecharla. 

Así que Amoxtli Vue tiene un montón de esas características que he construido para "la manera en la que a mí me gustaría aprender Vue".

::media-video{src="https://youtu.be/kIEMJui34_4" title="Amoxtli Vue: a book of Vue you can run" wide}
::

Un aspecto importante a resaltar es que los contenidos son escritos por un humano. Y que el orden de los retos, los quizzes y las lecciones ha sido curado a mano también. Lo que significa que aunque uso la ayuda de la IA para construir la plataforma en sí, los contenidos y la interacción que los estudiantes tendrán con la plataforma, está orientada a que haya una conexión entre el autor y las personas que están leyendo los contenidos, si es que eso tiene sentido.

::media-palette{dir="/media/amoxtli" width="1440" height="900" label="Las lecciones de Amoxtli"}
---
items:
  - id: live-code
    name: código en vivo
    label: Un ejemplo de v-on editado en la lección; al escribir un nombre y pulsar "Call my name", aparece un saludo en la consola bajo la vista previa.
  - id: walkthrough
    name: recorridos
    label: Un recorrido paso a paso por reactive(), avanzando por el código un cambio a la vez junto al ejemplo en ejecución.
  - id: types
    name: tipos
    label: Al pasar el cursor sobre un manejador de eventos tipado aparecen los tipos y la documentación de Event y HTMLInputElement, como en un editor.
  - id: annotations
    name: anotaciones
    label: Dos notas fijadas al código se iluminan al pasar el cursor, las coincidencias de v-if, v-else-if, v-else y latest-version se avivan una a una, y las líneas colapsadas se expanden y se vuelven a plegar.
  - id: themes
    name: temas
    label: La lección cambiada entre claro y oscuro; luego se abre el changelog desde el número de versión.
  - id: languages
    name: idiomas
    label: La lección de historia cambiada de inglés a español (México), sin que quien lee pierda su lugar.
---
::

A ninguna plataforma de aprendizaje que se respete le faltarían quizzes y retos, así que también tenemos esos. 

Los retos corren una batería de pruebas en un ambiente especialmente creado para la plataforma, y solo los pasas cuando todos las pruebas tienen su palomita.

::media-clip{src="/media/amoxtli/challenge.mp4" webm="/media/amoxtli/challenge.webm" poster="/media/amoxtli/challenge.webp" label="Un reto para construir un selector de colores; cada muestra pulsada llena la caja de la vista previa con su color y su nombre." width="1440" height="900"}
::

Los quizzes son dinámicos, lo que significa que cambian en el orden de las preguntas **y también de las respuestas** cada vez que recargas la página. Siempre tienes un orden diferente.

::media-clip{src="/media/amoxtli/quiz.mp4" webm="/media/amoxtli/quiz.webm" poster="/media/amoxtli/quiz.webp" label="El quiz de repaso de lo básico de Vue, respondido y revisado: cada respuesta explicada y el quiz aprobado con 100 de 100." width="1440" height="1300"}
::

Aquí hay un preview de lo que ya llevo escrito hasta ahora. Es un trabajo que sigue *en progreso* realmente, pero estoy haciendo lo posible por completarlo y poder ofrecerlo al público. Actualmente solo está disponible a través de una invitación personal. Puedo enviarte una si te interesa. Sólo hazme saber. 😉

::media-clip{src="/media/amoxtli/contents.mp4" webm="/media/amoxtli/contents.webm" poster="/media/amoxtli/contents.webp" label="El árbol de contenidos del libro, abierto desde el encabezado de la lección; se expanden Interactividad, Reactividad y Estilos, y la lista baja hasta el reto de Estilos." width="1440" height="900"}
::
