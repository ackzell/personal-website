---
title: "playground"
description: "El entorno en el navegador para las lecciones y los retos, creado sobre un fork de almostnode."
---

Antes de que te cuente acerca de los últimos cambios, te contaré acerca de lo que tenía al principio. Era un proyecto basado en [TutorialKit](https://tutorialkit.dev/) y funcionaba más o menos, pero decidí moverme a una solución que fuera verdaderamente basada en el ecosistema de Vue para la plataforma.

Incluso después de moverme a Nuxt Content y debido al hecho que hice un fork de [learn.nuxt.com](https://learn.nuxt.com/en), la primera porción _interactiva_ del libro era este playground, que originalmente estaba basado en [web containers](https://webcontainers.io/), pero después encontré [almostnode](https://almostnode.dev/) y decidí migrar hacia él.

::media-clip{src="/media/amoxtli/playground.mp4" webm="/media/amoxtli/playground.webm" poster="/media/amoxtli/playground.webp" label="Código editado en el Playground y guardado como snapshot; el snapshot comparado lado a lado con el código actual y, al salir con cambios sin guardar, un aviso para guardarlos." width="1440" height="900" wide}
::

## Algunos detalles técnicos (pero no todos)

Tuve que hacer un fork de almost node y modificarlo para hacer que funcionara, pero un día finalmente lo hizo. La idea principal es tener un ambiente muy similar al que tendrías en tu propia computadora corriendo Node con Vite y sirviendo tu ambiente de desarrollo.

La verdad, utilicé inteligencia artificial realmente para todo esto de la migración. Pero al ver los resultados y después de muchos auditorías que le hice al código, creo que está trabajando lo mejor que pude haberlo hecho funcionar así que lo dejé en la plataforma.

Algo no menos importante es que también quería probar utilizar IA y ver hasta dónde podría llegar en algo que de otra forma no me sentiría cómodo haciendo por mi cuenta y probablemente hubiera tardado mucho tiempo, así que es una de las razones por las que hice la migración también.

Lo que hace el fork, sobre todo es servir Vue SFCs en un Vite 7 real y soporta hot module replacement o HMR, un shell interactivo, y la salida de la consola sin tener el ruido de la página huésped (la app de Nuxt, pues). También tiene una API compatible con la de web containers para evitar reescribir la parte que se conecta dentro de la aplicación de Nuxt.

El playground comparte un par de características de [yehyecoa](/projects/yehyecoa) que son el control de versiones y arrastrar y colocar para reorganizar el layout.
