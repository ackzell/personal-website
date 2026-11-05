---
title: "Moliniani"
description: "Crea videos de Motion Canvas con componentes de Vue."
meaning: "movimiento"
pronunciation: "mo-li-NIÁ-ni"
---

<!-- TODO(owner): every paragraph, caption and video label on this page (and the "Code theme", "Scrub through the clip" and "Running …" strings in i18n/locales/*.json) is a placeholder drafted by Claude, not yours. Rewrite them in your own words, in both languages, before launch. The code blocks are the real scenes and can stay. -->

Motion Canvas describe un video como código: una escena es un generador que dice qué se mueve, cuánto y por cuánto tiempo, y su editor recorre esa línea de tiempo cuadro por cuadro. Pero todo lo que aparece en pantalla tiene que ser una de sus propias figuras de canvas. Un componente con estilos, un layout que ya construiste, una escena 3D: ninguno puede entrar.

Moliniani deja que un componente de Vue se pare en esa línea de tiempo como cualquier otra figura. Sus props se vuelven señales de Motion Canvas, así que `yield* box().width(700, 2)` anima un componente igual que anima un rectángulo, ambos pueden compartir un mismo `all()`, y ambos se recorren hacia adelante y hacia atrás sin desfasarse.

::media-take{src="/media/moliniani/together.mp4" webm="/media/moliniani/together.webm" poster="/media/moliniani/together.webp" width="1920" height="1080" label="Una caja verde de Vue se ensancha junto a un rectángulo con contorno; luego la caja se vuelve verde azulado mientras el rectángulo se llena de azul, y la etiqueta de la caja cambia."}
---
cues:
  - { at: 0, file: scene.tsx, lines: [24] }
  - { at: 2, file: scene.tsx, lines: [25, 26, 27, 28] }
  - { at: 4, file: scene.tsx, lines: [29] }
  - { at: 4.5, file: scene.tsx, lines: [30] }
---
```tsx [scene.tsx]
import { all, createRef, waitFor } from "@motion-canvas/core";
import { Rect } from "@motion-canvas/2d";
import { createMnRef, makeScene } from "@moliniani/core";
import MyBox from "@/components/MyBox.vue";

export default makeScene(function* (view) {
  const box = createMnRef(MyBox);
  const rect = createRef<Rect>();

  view.add(
    <>
      <MyBox
        ref={box}
        x={-300}
        label="a Vue box"
        width={500}
        height={300}
        backgroundColor="#2f6b3a"
      />
      <Rect ref={rect} x={400} size={300} stroke="#87ff6f" lineWidth={2} />
    </>,
  );

  yield* box().width(700, 2);
  yield* all(
    box().backgroundColor("#41998d", 2),
    rect().fill("#0088cc", 2),
  );
  yield* box().label("Changed props!", 0.5);
  yield* waitFor(1);
});
```

```vue [MyBox.vue]
<script setup lang="ts">
const props = defineProps<{
  label?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
}>();
</script>

<template>
  <div class="box">
    <span class="my-label"> {{ props.label }}</span>
  </div>
</template>

<style scoped>
.box {
  width: v-bind('props.width ? `${props.width}px` : "100px"');
  height: v-bind('props.height ? `${props.height}px` : "100px"');
  background: v-bind('props.backgroundColor ? props.backgroundColor : "green"');
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: v-bind('props.borderRadius ? `${props.borderRadius}px` : "10px"');
}

.my-label {
  padding: 20px;
  color: v-bind('props.textColor ? props.textColor : "greenyellow"');
  font-size: 30px;
  text-align: center;
}
</style>
```

Un componente de Vue y un rectángulo de Motion Canvas, en una misma línea de tiempo. El componente nunca se anima solo: en cada cuadro, sus props toman el valor que la línea de tiempo dice.
::

El navegador acomoda el componente como HTML real, y en cada cuadro lo pinta en el canvas del video con la nueva API HTML-in-canvas de Chrome. Nada corre con un reloj; cada cuadro se calcula desde la línea de tiempo, y por eso se puede recorrer.
::media-take{src="/media/moliniani/typewriter.mp4" webm="/media/moliniani/typewriter.webm" poster="/media/moliniani/typewriter.webp" width="1920" height="1080" label="“Precision in motion.” se escribe letra por letra, da paso a “Write. Pause. Continue.” y luego se desvanece."}
---
cues:
  - { at: 0, lines: [19] }
  - { at: 3, lines: [20] }
  - { at: 4.7, lines: [21] }
---
```tsx [scene.tsx]
import { createMnRef, makeScene } from "@moliniani/core";
import { AnimatedText } from "@moliniani/components/vue";
import { createPhraseSwitcher, TYPING_TEXT } from "@moliniani/components";

export default makeScene(function* (view) {
  const text = createMnRef(AnimatedText);

  view.add(
    <AnimatedText
      ref={text}
      effect={TYPING_TEXT}
      text=""
      fontSize={112}
      color="#ffd166"
    />,
  );

  const phrases = createPhraseSwitcher(text);
  yield* phrases.phrase("Precision in motion.");
  yield* phrases.phrase("Write. Pause. Continue.");
  yield* text().opacity(0, 0.5);
});
```

Uno de unos treinta efectos de texto, todos movidos por una misma especificación: `effect` elige cuál.
::

::media-take{src="/media/moliniani/background.mp4" webm="/media/moliniani/background.webm" poster="/media/moliniani/background.webp" width="1920" height="1080" label="Un campo de cuadros verde lima se desplaza, acelera y luego se apretuja."}
---
cues:
  - { at: 0, lines: [18] }
  - { at: 2, lines: [19] }
  - { at: 5, lines: [20] }
---
```tsx [scene.tsx]
import { createMnRef, makeScene } from "@moliniani/core";
import { easeInSine, waitFor } from "@motion-canvas/core";
import { GroovySquaresBackground } from "@moliniani/components/backgrounds";

export default makeScene(
  function* (view) {
    const bg = createMnRef(GroovySquaresBackground);

    view.add(
      <GroovySquaresBackground
        ref={bg}
        color0="#bada55"
        speed={2}
        density={5}
      />,
    );

    yield* waitFor(2);
    yield* bg().speed(4, 3, easeInSine);
    yield* bg().density(8, 3, easeInSine);
  },
  { background: false },
);
```

Cinco fondos generativos hasta ahora (un campo de flujo, una malla de resortes, vidrio fracturado, curvas de nivel y estos cuadros), con props que se animan como cualquier otra.
::

Una escena de TresJS toma el otro camino: solo se dibuja cuando la línea de tiempo lo pide, y su cuadro de WebGL se pinta en el mismo canvas. La cámara, la rotación y el color del material son props, así que también son señales.

::media-take{src="/media/moliniani/tres.mp4" webm="/media/moliniani/tres.webm" poster="/media/moliniani/tres.webp" width="1920" height="1080" label="Un cubo magenta, visto mientras la cámara gira a su alrededor; da una vuelta completa y luego se vuelve naranja."}
---
cues:
  - { at: 0, file: scene.tsx, lines: [20, 21, 22, 23] }
  - { at: 5, file: scene.tsx, lines: [24] }
  - { at: 8, file: scene.tsx, lines: [25] }
  - { at: 9, file: scene.tsx, lines: [26] }
---
```tsx [scene.tsx]
import { all, easeInOutCubic, waitFor } from "@motion-canvas/core";
import { createMnRef, makeScene } from "@moliniani/core";
import TresBox from "@/components/TresBox.vue";

export default makeScene(function* (view) {
  const box = createMnRef(TresBox);

  view.add(
    <TresBox
      ref={box}
      width={1920}
      height={1080}
      color="magenta"
      rotationY={0}
      cameraX={0}
      cameraZ={7}
    />,
  );

  yield* all(
    box().cameraX(4, 5, easeInOutCubic),
    box().cameraZ(4, 5, easeInOutCubic),
  );
  yield* box().rotationY(Math.PI * 2, 3, easeInOutCubic);
  yield* box().color("#ff6644", 1, easeInOutCubic);
  yield* waitFor(1);
});
```

```vue [TresBox.vue]
<script setup lang="ts">
const props = defineProps<{
  rotationY?: number;
  rotationX?: number;
  color?: string;
  cameraX?: number;
  cameraY?: number;
  cameraZ?: number;
  lookAtX?: number;
  lookAtY?: number;
  lookAtZ?: number;
}>();
</script>

<template>
  <TresPerspectiveCamera
    :position="[props.cameraX ?? 0, props.cameraY ?? 2, props.cameraZ ?? 7]"
    :look-at="[props.lookAtX ?? 0, props.lookAtY ?? 0, props.lookAtZ ?? 0]"
  />
  <TresAmbientLight :intensity="1.2" />
  <TresDirectionalLight :position="[5, 8, 5]" :intensity="1.5" cast-shadow />
  <TresMesh :rotation-y="props.rotationY ?? 0" :rotation-x="props.rotationX ?? 0">
    <TresBoxGeometry :args="[2, 2, 2]" />
    <TresMeshStandardMaterial :color="props.color ?? '#4488ff'" />
  </TresMesh>
</template>
```

Sin Three.js imperativo: el movimiento de cámara y el giro son animaciones en la misma línea de tiempo.
::

Animar una página con CSS o GSAP corre con el reloj: puedes reproducirla, pero no puedes saltar al cuadro 212 y obtener la misma imagen cada vez, que es justo lo que necesita exportar un video. Remotion también hace video con componentes, pero ahí cada cuadro es una función de su número, y cada valor se calcula a partir de él. Aquí conservas la forma de trabajar de Motion Canvas: describes la secuencia (espera, mueve esto, luego desvanece aquello) y la línea de tiempo calcula los cuadros, con sus refs, señales y transiciones mezcladas libremente con Vue.

Hasta dónde llega: Vue siempre se dibuja encima de las figuras de Motion Canvas, así que no se pueden intercalar. Y HTML-in-canvas sigue detrás de una bandera en Chrome, así que los componentes solo se ven ahí; los fondos y el 3D funcionan en cualquier lado. Ese es el experimento.
