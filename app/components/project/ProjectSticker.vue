<script setup lang="ts">
import { animate, useMotionValue, useMotionValueEvent, type Transition } from 'motion-v'

/**
 * A project's mark as a metallic sticker: a silhouette (black in the dark
 * scheme, silver in the light one) with a hairline edge and the mark's own
 * detail faintly over it. It tilts toward the pointer and catches a sheen
 * there, its colour coming back; at rest a glint crosses it now and then, a
 * hint that it answers to the pointer.
 *
 * Driven by state, not :hover, so a finger dragged on it does the same; a
 * touch keeps reporting to it after leaving it, so the position is clamped to
 * its edges. Decorative: whatever it sits beside names the project.
 *
 * The tilt rides springs: it follows the pointer closely, and let go it
 * swings back to flat with the speed it was moving at, overshooting and
 * rocking to rest like a card set down. Pressed or hovered it lifts a little
 * toward you, and drops back with a bounce.
 */
defineProps<{ src: string }>()

const root = useTemplateRef<HTMLElement>('root')
const active = ref(false)
const reducedMotion = usePreferredReducedMotion()

const FOLLOW: Transition = { type: 'spring', bounce: 0, visualDuration: 0.18 }
const ROCK: Transition = { type: 'spring', bounce: 0.45, visualDuration: 0.7 }
const LIFT: Transition = { type: 'spring', bounce: 0.4, visualDuration: 0.35 }
const LIFTED = 1.04

// Where the pointer is across it, 0 to 1 each way, and how far it's lifted.
const x = useMotionValue(0.5)
const y = useMotionValue(0.5)
const lift = useMotionValue(1)
const write = (name: string) => (now: number) => root.value?.style.setProperty(name, String(now))
useMotionValueEvent(x, 'change', write('--x'))
useMotionValueEvent(y, 'change', write('--y'))
useMotionValueEvent(lift, 'change', write('--lift'))

const spring = (transition: Transition) => reducedMotion.value === 'reduce' ? { duration: 0 } : transition
const clamp = (value: number) => Math.min(1, Math.max(0, value))

/*
 * Tilted about under a finger, it gives a grain every GRAIN px the finger
 * travels, no closer than GAP ms, firmer the further it leans from flat.
 */
const GRAIN = 14
const GAP = 45
let travel: { x: number, y: number, run: number, at: number } | undefined

function feel(event: PointerEvent, toX: number, toY: number) {
  if (event.pointerType === 'mouse') return
  // A finger picking it up feels it come off the page.
  if (event.type === 'pointerdown') {
    if (!active.value) haptic('lift')
    travel = { x: event.clientX, y: event.clientY, run: 0, at: event.timeStamp }
    return
  }
  if (!travel) return
  travel.run += Math.hypot(event.clientX - travel.x, event.clientY - travel.y)
  travel.x = event.clientX
  travel.y = event.clientY
  if (travel.run < GRAIN || event.timeStamp - travel.at < GAP) return
  travel.run = 0
  travel.at = event.timeStamp
  // 0 flat in the middle, 1 at a corner.
  haptic('tilt', Math.min(Math.hypot(toX - 0.5, toY - 0.5) * 2, 1))
}

function tilt(event: PointerEvent) {
  const el = root.value
  if (!el) return
  const box = el.getBoundingClientRect()
  const toX = clamp((event.clientX - box.left) / box.width)
  const toY = clamp((event.clientY - box.top) / box.height)
  feel(event, toX, toY)
  animate(x, toX, spring(FOLLOW))
  animate(y, toY, spring(FOLLOW))
  if (!active.value) animate(lift, LIFTED, spring(LIFT))
  active.value = true
}

function rest() {
  active.value = false
  travel = undefined
  animate(x, 0.5, spring(ROCK))
  animate(y, 0.5, spring(ROCK))
  animate(lift, 1, spring(LIFT))
}

// A mouse button let go over it still hovers; a lifted finger doesn't.
function release(event: PointerEvent) {
  if (event.pointerType !== 'mouse') rest()
}
</script>

<template>
  <span ref="root" class="sticker" aria-hidden="true" :style="{ '--mark': `url(${src})` }"
    :data-active="active || undefined" @pointerdown="tilt" @pointermove="tilt" @pointerup="release"
    @pointerleave="rest" @pointercancel="rest">
    <img class="sticker__face" :src="src" alt="" width="320" height="320" decoding="async" draggable="false">
    <img class="sticker__detail" :src="src" alt="" width="320" height="320" decoding="async" draggable="false">
    <span class="sticker__shine" />
  </span>
</template>

<style scoped>
/* Dark scheme: a black sticker with light catching on it. */
.sticker {
  --x: 0.5;
  --y: 0.5;
  --lift: 1;
  --edge: #3a3a3a;
  --face: brightness(0);
  --detail: 0.25;
  --glare: 0.25;
  --band: 0.28;
  --band-cool: 0.18;
  --band-warm: 0.14;
  --streak: 0;
  --grain: rgb(255 255 255 / 0.04);
  --glint: 0.35;
  position: relative;
  display: block;
  /* The outline follows the mark's shape: four hairline shadows of the
     silhouette, one per side. */
  filter: drop-shadow(1.5px 0 0 var(--edge)) drop-shadow(-1.5px 0 0 var(--edge)) drop-shadow(0 1.5px 0 var(--edge)) drop-shadow(0 -1.5px 0 var(--edge));
  /* --x, --y and --lift come from the springs (script); flat at rest. */
  transform: perspective(900px) rotateX(calc((0.5 - var(--y)) * 16deg)) rotateY(calc((var(--x) - 0.5) * 16deg)) scale(var(--lift));
  /* A drag that starts on it tilts it instead of scrolling the page; there's
     room either side to scroll from. No callout or selection on a long press. */
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
}

/* Light and vivid: silver (on vivid's graphite work too, where black metal
   would sink). Pale metal only reads as shiny with a dark streak
   beside the bright one, so the band gets one. */
:root:not(.dark) .sticker {
  --edge: #9a9a9a;
  --face: brightness(0) invert(0.83);
  --detail: 0.4;
  --glare: 0.6;
  --band: 0.7;
  --band-cool: 0.3;
  --band-warm: 0.25;
  --streak: 0.14;
  --grain: rgb(0 0 0 / 0.04);
  --glint: 0.8;
}

.sticker__face {
  display: block;
  inline-size: 100%;
  block-size: auto;
  filter: var(--face);
}

/* The mark's own detail, in black and white over the silhouette; its colour
   comes back while it's active. */
.sticker__detail {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  filter: grayscale();
  opacity: var(--detail);
  transition: filter 300ms var(--ease-out);
}

.sticker[data-active] .sticker__detail {
  filter: none;
}

/* The sheen, cut to the mark: a brushed grain, a diagonal band that slides
   with the pointer, and a soft glare opposite it. */
.sticker__shine {
  position: absolute;
  inset: 0;
  mask: var(--mark) center / 100% 100% no-repeat;
  background:
    radial-gradient(circle at calc((1 - var(--x)) * 120%) calc((1 - var(--y)) * 100%), rgb(255 255 255 / var(--glare)), transparent 45%),
    linear-gradient(115deg, transparent 20%, rgb(0 0 0 / var(--streak)) 34%, rgb(255 255 255 / var(--band)) 44%, rgb(180 200 255 / var(--band-cool)) 50%, rgb(255 220 240 / var(--band-warm)) 56%, rgb(0 0 0 / calc(var(--streak) / 2)) 64%, transparent 75%) calc(var(--x) * 100%) calc(var(--y) * 100%) / 250% 250%,
    repeating-linear-gradient(90deg, var(--grain) 0 1px, transparent 1px 3px);
  opacity: 0;
  transition: opacity 300ms var(--ease-out);
  pointer-events: none;
}

.sticker[data-active] .sticker__shine {
  opacity: 1;
}

/* The glint at rest. It sweeps in the first part of the cycle and waits out
   the rest; the first one waits for the page to settle. */
.sticker::after {
  content: '';
  position: absolute;
  inset: 0;
  mask: var(--mark) center / 100% 100% no-repeat;
  background: linear-gradient(115deg, transparent 40%, rgb(255 255 255 / var(--glint)) 50%, transparent 60%) 100% 0 / 300% 100% no-repeat;
  animation: sticker-glint 35s var(--ease-in-out) 1.5s infinite;
  pointer-events: none;
}

.sticker[data-active]::after {
  animation: none;
  opacity: 0;
}

@keyframes sticker-glint {
  0% {
    background-position: 100% 0;
  }

  14%,
  100% {
    background-position: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sticker {
    transform: none;
  }

  .sticker::after {
    animation: none;
    opacity: 0;
  }
}
</style>
