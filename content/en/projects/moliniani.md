---
title: "Moliniani"
description: "Write Motion Canvas videos as Vue components."
meaning: "movement"
pronunciation: "mo-lee-NEEAH-nee"
---

::media-video{src="https://youtu.be/0eijkFnAEXU" title="#VueJS meets #MotionCanvas Introducing the project and its progress so far"}
Rather lengthy video explaining what the project looked like at that time. It goes basically through what this page explains already.
::

Remember I mentioned [aarthificial](https://www.youtube.com/aarthificial) before, when I was making the [videos](/projects/tlapalli/videos) for Tlapalli? This is an experiment on building on top of the library I used for those: [Motion Canvas](https://www.youtube.com/playlist?list=PLh0j6fxciWbIYnyKAW24k_Sr99MeJ-0nk). Instead of writing "JSX-like components," I thought we could use Vue as the authoring layer.

When I started on this HTML-in-canvas was available, though still only behind a flag. I decided to give it a shot anyway: take the output of a Vue-rendered element and put it inside a canvas. That way we can use the Vue skills we already have for building components and turn them into these really nice-looking videos.

I built most of this with the free models on OpenCode. I haven't gone back to the project with the heavier-hitting models yet, and they might approach it differently. Still, seeing Vue components I wrote get rendered as videos was a really exciting moment for me.

Here are a couple of examples of what it can do right now and where the experiment is at. Let me know what you think!

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


Once I had Vue running inside Motion Canvas, I realized we could probably bring in [Tres.js](https://tresjs.org/) too, the library for doing 3D stuff but Vue flavored. 

We already knew how to render both three.js as well as Vue in Motion Canvas, so rendering Tres.js shouldn't be that hard, right?

Here's an example of the Tres.js code working. You could just write your normal tres code and expose the props. They will be turned into signals and will be animated however you want.

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

At some point I thought, "Okay, now we can animate stuff. There are already great animation libraries for things like text, so I'll try bringing in [Anime.js](https://animejs.com/) for the animation logic on text", and it was interesting. I can't remember if it's what we ended up using for everything. 

But then I also found some published [skills](https://pixelpoint.io/skills/animate-text/) that help you build really interesting text animations, so I added those too.

I paid close attention to the API, because I really wanted the code to be readable. You should be able to write this code by hand, or understand it if you read through it. I think that's part of what the author of MC originally intended, too. Keep in mind that his is mostly pre-AI work and the idea was never to build an engine that any AI could just use to make a video. It was about being able to do it by hand, with full control over where things are, the exact moment they happen, and how they look, so they match what you're picturing on your head.

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

Once I had the text going, I decided to also bring in [some backgrounds](https://radiant-shaders.com/gallery/all) because on the video for Tlapalli I already had a background that I created with shaders and Motion Canvas does support them so the idea was now to create a sort of library of backgrounds that I could use in different videos and that's how this came to be.

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

Five generative backgrounds so far (`FlowFieldBackground`, `KineticGridBackground`, `SugarGlassBackground`, `TopographicBackground` and this one, `GroovySquaresBackground`), with props that tween like any other.
::

::media-video{src="https://youtu.be/U7Q3hsBK534" title="Moliniani - new backgrounds"}
Another lengthy video that explains a little bit more on the backgrounds for Moliniani.
::

Now for a quick and nice summary of what all of this is, I let the AI work on the following paragraphs. Enjoy!

Animating a page with CSS or GSAP runs on the wall clock: you can play it, but you can't jump to frame 212 and get the same picture every time, which is exactly what exporting a video needs. Remotion makes video from components too, but there each frame is a function of its number, and you compute every value from it. Here you keep Motion Canvas's way of working, describing the sequence (wait, move this, then fade that) and letting the timeline work out the frames, with its refs, signals and transitions mixed freely with Vue.

Where it stops: Vue always draws above Motion Canvas's shapes, so the two can't interleave. And HTML-in-canvas is still behind a flag in Chrome, so components only render there; backgrounds and 3D work anywhere. That's the experiment.
