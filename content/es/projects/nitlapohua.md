---
title: "Nitlapohua"
description: "Una batalla de cálculo mental para jugar en familia, desde el sillón."
meaning: "yo cuento"
pronunciation: "ni-tla-PÓ-ua"
---

Todos en casa podríamos hacer un poco de práctica de matemáticas, así que construí esta aplicación para ayudar a mis hijos con sus cálculos mentales. El objetivo es hacerlos sentir como en un juego y que podamos jugar varias personas al mismo tiempo, pero que también puedan usarla por su cuenta.

Hay dos maneras de jugar:

- **Modo batalla**: donde todos los jugadores entran al mismo tiempo y van todos contra todos en tiempo real.
- **Modo individual**: donde pueden practicar su aritmética básica por su cuenta a su propio ritmo.

::media-stills{dir="/media/nitlapohua/stills" width="1170" height="2532" label="Pantallas de Nitlapohua"}
---
items:
  - src: question-john
    alt: El teléfono de John en nivel 2, una resta de un dígito sobre el teclado de pizarrón.
    caption: "Cada quien recibe su propia pregunta. John va en nivel 2, así que le tocan operaciones de un dígito."
  - src: question-paul
    alt: "El teléfono de Paul en un nivel más alto, una división: 63 ÷ 7."
    caption: "En la misma ronda, Paul va en nivel 8 y le tocan divisiones."
  - src: question-george
    alt: "El teléfono de George en un nivel todavía mayor, una división más larga: 295 ÷ 5."
    caption: "Y a George, en nivel 14, divisiones un poco más largas. El mismo juego, cada quien a su nivel."
  - src: lobby
    alt: La sala de espera, con el código QR, el código de cuatro letras y los tres jugadores listos.
    caption: "Escanea el código QR o escribe el código de cuatro letras para unirte desde tu teléfono."
  - src: calibration
    alt: La calibración inicial de Ringo, respondiendo hasta fallar dos.
    caption: "La primera ronda encuentra tu nivel: sigues respondiendo hasta fallar dos."
  - src: stamp
    alt: Una respuesta correcta sellada con ¡BIEN!, y los puntos que ganó debajo.
    caption: "Si aciertas, te la sellan con un ¡BIEN! y los puntos que ganaste."
  - src: streak
    alt: Una quinta respuesta correcta seguida, con la insignia de racha ×3 y los puntos multiplicados.
    caption: "Mantén una racha y tus puntos empiezan a multiplicarse."
  - src: interlude
    alt: Entre rondas, con la tabla de posiciones, el resumen de la última ronda y el botón para la siguiente.
    caption: "Entre rondas, revisa las posiciones y cómo te fue en la última."
  - src: results
    alt: Posiciones finales, con el puntaje de cada jugador y cómo se movió su nivel.
    caption: "Al final, el puntaje de cada quien y cuánto se movió su nivel."
---
::


## La construcción en sí
Este es uno de los primeros proyectos donde comencé a utilizar skills, más específicamente las skills, grill-me y handoff, y todo lo que hice fue darle la tecnología que quería usar y después pelotear algunas ideas con el LLM. 

Después de eso fui pidiendo cambios específicos y cosas que quería hacer, y aquí hay un poco más de la explicación de cómo fue este proceso:

::media-video{src="https://youtu.be/Jryar4K7ltQ" title="Nitlapōhua: A multiplayer maths game I made for my kids" poster="/media/nitlapohua/essay.jpg"}
::