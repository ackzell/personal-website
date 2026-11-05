---
title: "Moliniani"
description: "Write Motion Canvas videos as Vue components."
meaning: "movement"
pronunciation: "mo-lee-NEEAH-nee"
---

<!-- TODO(owner): every paragraph, caption and video label on this page (and the "Code theme", "Scrub through the clip" and "Running …" strings in i18n/locales/*.json) is a placeholder drafted by Claude, not yours. Rewrite them in your own words, in both languages, before launch. The code blocks are the real scenes and can stay. -->

Motion Canvas describes a video as code: a scene is a generator that says what moves, by how much and for how long, and its editor scrubs that timeline frame by frame. But everything on screen has to be one of its own canvas shapes. A styled component, a layout you already built, a 3D scene: none of them can join.

Moliniani lets a Vue component stand on that timeline like any other shape. Its props become Motion Canvas signals, so `yield* box().width(700, 2)` tweens a component the way it tweens a rectangle, both can share one `all()`, and both scrub backwards and forwards without drifting.

::media-take{src="/media/moliniani/together.mp4" webm="/media/moliniani/together.webm" poster="/media/moliniani/together.webp" width="1920" height="1080" label="A green Vue box grows wider beside an outlined rectangle; then the box turns teal while the rectangle fills blue, and the box's label changes."}
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

A Vue component and a Motion Canvas rectangle, on one timeline. The component never animates itself: every frame, its props are set to where the timeline says they are.
::

A component is laid out by the browser as real HTML, then painted into the video's canvas every frame with Chrome's new HTML-in-canvas API. Nothing runs on a clock; each frame is worked out from the timeline, which is why it scrubs.
::media-take{src="/media/moliniani/typewriter.mp4" webm="/media/moliniani/typewriter.webm" poster="/media/moliniani/typewriter.webp" width="1920" height="1080" label="“Precision in motion.” types itself out letter by letter, gives way to “Write. Pause. Continue.”, then fades."}
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

One of about thirty text effects, all driven by a single spec: `effect` picks which.
::

::media-take{src="/media/moliniani/background.mp4" webm="/media/moliniani/background.webm" poster="/media/moliniani/background.webp" width="1920" height="1080" label="A field of lime squares drifts, speeds up, then packs tighter."}
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

Five generative backgrounds so far (a flow field, a spring mesh, fractured glass, contour lines and these squares), with props that tween like any other.
::

A TresJS scene takes the other path: it renders only when the timeline asks, and its WebGL frame is drawn onto the same canvas. Camera, rotation and material color are props, so they're signals too.

::media-take{src="/media/moliniani/tres.mp4" webm="/media/moliniani/tres.webm" poster="/media/moliniani/tres.webp" width="1920" height="1080" label="A magenta cube, seen as the camera swings around it; it spins a full turn, then turns orange."}
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

No imperative Three.js: the camera move and the spin are tweens on the same timeline.
::

Animating a page with CSS or GSAP runs on the wall clock: you can play it, but you can't jump to frame 212 and get the same picture every time, which is exactly what exporting a video needs. Remotion makes video from components too, but there each frame is a function of its number, and you compute every value from it. Here you keep Motion Canvas's way of working, describing the sequence (wait, move this, then fade that) and letting the timeline work out the frames, with its refs, signals and transitions mixed freely with Vue.

Where it stops: Vue always draws above Motion Canvas's shapes, so the two can't interleave. And HTML-in-canvas is still behind a flag in Chrome, so components only render there; backgrounds and 3D work anywhere. That's the experiment.
