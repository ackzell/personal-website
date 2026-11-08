---
title: "Tlachialoni"
description: "Un navegador local minimalista para desarrollo frontend."
meaning: "instrumento para ver"
pronunciation: "tla-chia-LÓ-ni"
---

Una ventana sin marco que muestra un servidor de desarrollo local de borde a borde, con las DevTools de Chromium dentro de la misma ventana.

::media-palette{dir="/media/tlachialoni" width="1440" height="900" label="Tlachialoni, un navegador minimalista para desarrollo"}
---
items:
  - id: video
    name: video
    label: Video de lanzamiento en YouTube
    video: https://youtu.be/3mEV4Aqni_s
    caption: Este es el video que grabé para el "lanzamiento" del proyecto. Nota que en ese momento las DevTools todavía no tenían tema.
  - id: tour
    name: recorrido
    label: Todas las funciones en un GIF.
    caption: Todas las funciones en un GIF.
  - id: palette
    name: paleta
    label: La paleta de comandos.
    caption: La paleta de comandos. Desde aquí controlamos la navegación, los ajustes de la app, las extensiones y el layout de la interfaz.
  - id: theme-picker
    name: temas
    label: El navegador soporta 8 variaciones de Tlapalli, mi propio tema para VSCode
    caption: "El navegador soporta 8 variaciones de Tlapalli, mi propio tema para VSCode. En modo oscuro y claro: Obsidian, Gold, Turquoise, Quartz, Lapis Lazuli, Amethyst, Jade y Fire Opal."
  - id: themed-devtools
    name: devtools con tema
    label: El tema de las DevTools sigue al del navegador.
    caption: El tema de las DevTools sigue al del navegador. Al principio no lo tenía, pero me di cuenta de que lo podía implementar después, y creo que se ve muy bien.
  - id: history
    name: historial
    label: Se puede navegar con gestos de deslizar.
    caption: Desliza en tu touchpad para ir hacia atrás y hacia adelante.
  - id: reload
    name: recarga
    label: Un indicador de recarga
    caption: También lo agregué después del video de lanzamiento. Al recargar se ilumina todo el borde de la ventana, y para el hard reload hice uno un poco distinto.
  - id: light-mode
    name: apariencia
    label: Soporta modo claro
    caption: Puedes elegir modo claro u oscuro, o seguir el modo del sistema operativo.
  - id: strip
    name: barra de título
    label: La barra de título puede quedarse fija o mostrarse y ocultarse.
    caption: La barra de título puede quedarse fija o mostrarse y ocultarse.
  - id: picker
    name: selector
    label: Hay un selector para Inspeccionar Elemento.
    caption: Un selector para Inspeccionar Elemento que funciona aunque las DevTools no estén abiertas en ese momento.
---
::

## Tla qué?... 
Esto es un Tlachialoni (o Tlachieloni), un bastón que se representaba en manos de sumos sacerdotes o deidades que **veían a través** de un círculo hecho de algún tipo de espejo (obsidiana o metal):

::media-stills{dir="/media/tlachialoni/examples" width="1440" height="900" label="Qué es un tlachialoni"}
---
items:
  - src: codex-figures
    width: 522
    height: 381
    alt: "Dibujos de línea de Tezcatlipoca y Huitzilopochtli del Códice Tudela, el Códice Magliabechiano y el Códice Florentino, cada uno sosteniendo un tlachialoni: un bastón rematado con un disco atravesado por un agujero."
  - src: seated-deity
    width: 721
    height: 878
    alt: Una figura pintada de códice, sentada en un trono tejido, que levanta un tlachialoni con un agujero de borde rojo al centro de su disco.
  - src: xiuhtecuhtli
    width: 300
    height: 437
    alt: Xiuhtecuhtli pintado en una página de códice, con un escudo con cabeza de serpiente y un tlachialoni.
---
::

## Justifique.
Me gusta mucho la experiencia minimalista que tiene el navegador [Arc](https://arc.net/). Pero simplemente no logré que me funcionara como navegador para desarrollar el front end de mis apps. Así que después de ir cambiando entre algunos otros navegadores, incluyendo el buen Google Chrome de siempre y el navegador [Orion](https://orionbrowser.com/), decidí intentarlo y crear mi propia versión de lo que podría ser un navegador minimalista enfocado en desarrollo.

Creo que también se ve muy bien en un video donde estoy mostrando la app en la que trabajo: lo que rodea a la página no distrae, así que puedo enfocar la atención en el contenido de la app.

## Capturas de pantalla

Aquí hay algunas capturas con un sitio de prueba, al que llamamos "Test Card", como las cartas de ajuste de la producción de video. La idea es que veas cómo se ve la interfaz cuando el navegador está en uso.

::media-stills{dir="/media/tlachialoni/stills" width="1440" height="900" label="Capturas de pantalla de la app Tlachialoni"}
---
items:
  - src: page-loaded
    alt: "La página Test Card llenando la ventana sin marco de borde a borde, sin nada del navegador alrededor."
    caption: "Solo la página. Sin pestañas, sin barra de direcciones, nada entre tú y lo que estás construyendo."
  - src: palette-all
    alt: "La paleta de comandos abierta sobre la ventana atenuada: destinos recientes de localhost y luego comandos para mostrar y acomodar las DevTools, inspeccionar, recargar y regresar, cada uno con su atajo."
    caption: "Todo empieza en la paleta de comandos: saltar a un puerto local, acomodar las DevTools, inspeccionar, recargar."
  - src: picker-hover
    alt: "El selector de Inspeccionar Elemento resaltando la tarjeta del accent swatch en la página Test Card, con las DevTools cerradas."
    caption: "El selector de Inspeccionar Elemento funciona aunque las DevTools estén cerradas."
  - src: devtools-bottom
    alt: "Las DevTools acomodadas en la parte de abajo de la ventana, con el mismo tema que el navegador, debajo de la página Test Card."
    caption: "Las DevTools abajo, con el mismo tema que el navegador."
  - src: devtools-right
    alt: "Las DevTools acomodadas a la derecha, con la página Test Card reacomodada en la columna más angosta de al lado."
    caption: "O a un lado, que de paso sirve para ver rápido un diseño más angosto."
  - src: history-overlay-back
    alt: "Una flecha hacia atrás en el borde izquierdo de la página, que aparece al deslizar en el touchpad para regresar."
    caption: "Desliza dos dedos en el touchpad y una flecha te muestra hacia dónde vas en tu historial de navegación (izquierda - atrás, derecha - adelante)."
  - src: failure
    alt: "La tarjeta de error para un destino al que no se puede llegar: \"Can't reach this target\", http://localhost:3000, conexión rechazada, con los botones Retry, Edit URL y Go Back."
    caption: "Cuando el servidor de desarrollo todavía no está corriendo, ves un error discreto con opción de reintentar en lugar de una ventana en blanco."
  - src: titlebar-mode
    alt: "La barra de título fija arriba de la página, con la dirección y los controles de la ventana, y el tamaño de la ventana en la esquina."
    caption: "La barra de título puede quedarse fija (el tamaño de la ventana en la esquina aparece con cada resize)"
  - src: strip-dark
    light: strip-light
    alt: "La franja delgada de título a lo ancho de la parte de arriba de la ventana, con la dirección y los controles de la ventana."
    caption: "O reducirse a una franja delgada que puedes mostrar y ocultar."
---
::

## Sobre cómo está hecho

Tenía muchas ganas de conservar las DevTools de Chromium, porque son a las que estoy acostumbrado. Así que terminé creando una app de Electron y decidí también traer [Spec Kit](https://speckit.org/) para manejar todo el proceso de construcción de la aplicación.

Para esto usé sobre todo los modelos de [OpenCode](https://opencode.ai/) con la suscripción de paga, y hasta ahora ha sido una experiencia bastante interesante.
