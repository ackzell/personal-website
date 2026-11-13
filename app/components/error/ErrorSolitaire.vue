<script setup lang="ts">
import { dealFor, draw, HEADING, move, RANKS, rankOf, REASONS, suitOf, targets, won, type From, type To } from '~/utils/solitaire'

/*
 * The 404 page is a game of solitaire dealt from the bad URL, one card short:
 * the missing 404 is this page's heading, which goes on the 4xx pile when its
 * turn comes. Every card sits in one flat list, placed from the game's state
 * by CSS, so a move is just a transition. Press a card to send it where it
 * can go (again for the next place), or drag it. Rules: utils/solitaire.ts.
 */
const route = useRoute()
const reducedMotion = usePreferredReducedMotion()

const game = shallowRef(dealFor(route.path))
const history = shallowRef<(typeof game.value)[]>([])
const said = ref('')

const finished = computed(() => won(game.value))
const headingPlaced = computed(() => game.value.piles[2]! > rankOf(HEADING))
// 403 is down: the heading's turn, and nothing else can go up the pile.
const waiting = computed(() => game.value.piles[2] === rankOf(HEADING))

const PILES = [
  { suit: 0, label: '2xx', to: '/', name: 'nav.about' },
  { suit: 1, label: '3xx', to: '/projects', name: 'nav.work' },
  { suit: 2, label: '4xx', to: '/content', name: 'nav.media' },
]

type Placed = { code: number, up: boolean, col: number, top: 0 | 1, downs: number, ups: number, z: number, shown: boolean, from?: From }

const cards = computed(() => {
  const { columns, stock, waste, piles } = game.value
  const placed: Placed[] = []
  stock.forEach((code, i) => placed.push({ code, up: false, col: 0, top: 0, downs: 0, ups: 0, z: stock.length - i, shown: false }))
  waste.forEach((code, i) => {
    const last = i === waste.length - 1
    placed.push({ code, up: true, col: 1, top: 0, downs: 0, ups: 0, z: i + 1, shown: last, from: last ? { from: 'waste' } : undefined })
  })
  for (const pile of PILES) {
    for (let rank = 0; rank < piles[pile.suit]!; rank++) {
      const code = (pile.suit + 2) * 100 + rank
      placed.push({ code, up: true, col: 2 + pile.suit, top: 0, downs: 0, ups: 0, z: 100 + rank, shown: rank === piles[pile.suit]! - 1 })
    }
  }
  columns.forEach((column, col) => {
    let downs = 0
    let ups = 0
    column.forEach((card, index) => {
      placed.push({ code: card.code, up: card.up, col, top: 1, downs, ups, z: index + 1, shown: card.up, from: card.up ? { from: 'column', col, index } : undefined })
      if (card.up) ups++
      else downs++
    })
  })
  // By code, whatever the state: the list's order mustn't change, or a card
  // moved in the DOM would lose its transition and its focus.
  return placed.sort((a, b) => a.code - b.code)
})

// The table is as tall as its longest column.
const tall = computed(() => {
  const heights = game.value.columns.map((column) => ({
    downs: column.filter((card) => !card.up).length,
    ups: Math.max(column.filter((card) => card.up).length - 1, 0),
  }))
  const longest = heights.reduce((a, b) => (b.downs * 0.4 + b.ups > a.downs * 0.4 + a.ups ? b : a))
  return { '--tall-downs': longest.downs, '--tall-ups': longest.ups }
})

const table = useTemplateRef<HTMLElement>('table')
const cascade = useTemplateRef<HTMLCanvasElement>('cascade')

// Won: once the last card has landed, the piles throw theirs across the screen, top cards first.
const bouncing = ref(false)
let stopBouncing: (() => void) | undefined
watch(finished, async (done) => {
  if (!done || reducedMotion.value === 'reduce') return
  await new Promise((resolve) => setTimeout(resolve, 450))
  if (!table.value || !finished.value) return
  bouncing.value = true
  await nextTick()
  const cards: HTMLElement[] = []
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    for (const suit of [2, 1, 0]) cards.push(table.value.querySelector<HTMLElement>(`[data-card="${(suit + 2) * 100 + rank}"]`)!)
  }
  stopBouncing = bounceCards(cascade.value!, cards, () => (bouncing.value = false))
})
onBeforeUnmount(() => {
  stopBouncing?.()
  rub?.stop()
})
const headingEl = useTemplateRef<HTMLElement>('headingEl')

// Cards just moved ride over the rest on their way.
const lifted = ref(new Set<number>())
let landing: ReturnType<typeof setTimeout> | undefined
function lift(codes: number[]) {
  lifted.value = new Set(codes)
  clearTimeout(landing)
  landing = setTimeout(() => (lifted.value = new Set()), 340)
}

const runOf = (from: From) => {
  if (from.from === 'heading') return [HEADING]
  if (from.from === 'waste') return [game.value.waste.at(-1)!]
  return game.value.columns[from.col]!.slice(from.index).map((card) => card.code)
}

function play(from: From, to: To, headingBox?: DOMRect) {
  const run = runOf(from)
  history.value = [...history.value, game.value]
  game.value = move(game.value, from, to)
  lift(run)
  said.value = `${run[0]} ${REASONS[run[0]!]}`
  haptic('lay')
  if (headingBox) nextTick(() => flyIn(headingBox))
}

/** The heading turning into its card: it flies from where it was to the pile. */
function flyIn(from: DOMRect) {
  const card = table.value?.querySelector<HTMLElement>(`[data-card="${HEADING}"]`)
  if (!card || reducedMotion.value === 'reduce') return
  const at = card.getBoundingClientRect()
  const place = getComputedStyle(card).transform
  card.animate([
    { transform: `translate(${from.left - at.left}px, ${from.top - at.top}px) ${place} scale(${from.width / at.width})` },
    { transform: `${place} scale(1)` },
  ], { duration: 420, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' })
}

function refuse(el: Element) {
  haptic('nudge')
  if (reducedMotion.value === 'reduce') return
  el.animate([{ translate: '0 0' }, { translate: '-4px 0' }, { translate: '3px 0' }, { translate: '0 0' }], { duration: 180 })
}

/*
 * Dragging. `dragged` swallows the click that ends a drag.
 */
const drag = shallowRef<{ from: From, codes: number[], el: HTMLElement, x: number, y: number, dx: number, dy: number, tilt: number, active: boolean }>()
let dragged = false
let rub: ReturnType<typeof soundRub>
let movedAt = 0
watch(() => !!drag.value, (held) => {
  if (held) return
  rub?.stop()
  rub = undefined
})

/** A press sends a card to its pile, or else to the next column it fits. */
function press(from: From, event: MouseEvent) {
  if (dragged) return
  const el = event.currentTarget as Element
  const options = targets(game.value, from)
  if (!options.length) return refuse(el)
  const col = from.from === 'column' ? from.col : -1
  const next = options.find((to) => to.to === 'pile')
    ?? options.find((to) => to.to === 'column' && to.col > col)
    ?? options[0]!
  play(from, next, from.from === 'heading' ? el.getBoundingClientRect() : undefined)
  if (event.detail === 0) nextTick(keepFocus)
}

function onDraw(event: MouseEvent) {
  if (!game.value.stock.length && !game.value.waste.length) return
  history.value = [...history.value, game.value]
  game.value = draw(game.value)
  haptic('turn')
  if (event.detail === 0) said.value = String(game.value.waste.at(-1) ?? '')
}

function undo() {
  const last = history.value.at(-1)
  if (!last) return
  game.value = last
  history.value = history.value.slice(0, -1)
  haptic('turn')
}

/** The same deal from the top, won or not. */
function reset() {
  stopBouncing?.()
  bouncing.value = false
  game.value = dealFor(route.path)
  history.value = []
  haptic('turn')
}

// Where the pointer is across the screen, as stereo: -1 left, 1 right.
const panAt = (event: PointerEvent) => event.clientX / innerWidth * 2 - 1

const TILT = 14 // degrees

function grab(event: PointerEvent, from: From) {
  if (event.button !== 0) return
  const el = event.currentTarget as HTMLElement
  el.setPointerCapture(event.pointerId)
  // The half it's held by comes up toward you: rotateX's positive way tips the top away.
  const box = el.getBoundingClientRect()
  const tilt = event.clientY < box.top + box.height / 2 ? -TILT : TILT
  drag.value = { from, codes: runOf(from), el, x: event.clientX, y: event.clientY, dx: 0, dy: 0, tilt, active: false }
}

function pull(event: PointerEvent) {
  const now = drag.value
  if (!now) return
  const dx = event.clientX - now.x
  const dy = event.clientY - now.y
  const active = now.active || Math.hypot(dx, dy) > 6
  if (active && !now.active) {
    haptic('pick')
    rub = soundRub(panAt(event))
    movedAt = event.timeStamp
  }
  if (active) {
    rub?.move(Math.hypot(dx - now.dx, dy - now.dy), event.timeStamp - movedAt, panAt(event))
    movedAt = event.timeStamp
  }
  drag.value = { ...now, dx, dy, active }
}

function drop() {
  const now = drag.value
  drag.value = undefined
  if (!now?.active) return
  dragged = true
  setTimeout(() => (dragged = false))
  const box = now.el.getBoundingClientRect()
  const overlap = (to: To) => {
    const name = to.to === 'pile' ? `pile-${suitOf(now.codes[0]!)}` : `column-${to.col}`
    const slot = table.value?.querySelector(`[data-drop="${name}"]`)?.getBoundingClientRect()
    if (!slot) return 0
    return Math.max(0, Math.min(box.right, slot.right) - Math.max(box.left, slot.left))
      * Math.max(0, Math.min(box.bottom, slot.bottom) - Math.max(box.top, slot.top))
  }
  const best = targets(game.value, now.from)
    .map((to) => ({ to, area: overlap(to) }))
    .sort((a, b) => b.area - a.area)[0]
  if (best?.area) play(now.from, best.to, now.from.from === 'heading' ? box : undefined)
  else {
    // Over the rest on its way back, as on its way to a new place.
    lift(now.codes)
    haptic('nudge')
  }
}

const dragging = (code: number) => !!drag.value?.active && drag.value.codes.includes(code)
const dragStyle = (code: number) => (dragging(code) ? { 'translate': `${drag.value!.dx}px ${drag.value!.dy}px`, '--tilt': `${drag.value!.tilt}deg` } : undefined)

/*
 * Keys: one stop on the table for Tab, arrows for the rest (role="toolbar",
 * which also keeps the site's ← and → from walking off the page). The order
 * is the table's, not the list's.
 */
const stops = computed(() => {
  const list: (number | 'stock')[] = ['stock']
  const waste = game.value.waste.at(-1)
  if (waste) list.push(waste)
  for (const column of game.value.columns) {
    for (const card of column) if (card.up) list.push(card.code)
  }
  return list
})
const rover = ref<number | 'stock'>('stock')
const tabStop = computed(() => (stops.value.includes(rover.value) ? rover.value : 'stock'))

function focusStop(stop: number | 'stock') {
  rover.value = stop
  nextTick(() => table.value?.querySelector<HTMLElement>(`[data-card="${stop}"]`)?.focus())
}

// A card sent to its pile can't be pressed again, and takes the focus with it.
function keepFocus() {
  const now = document.activeElement as HTMLButtonElement | null
  if (!now || now === document.body as unknown || now.disabled) focusStop(tabStop.value)
}

function step(event: KeyboardEvent) {
  const way = ({ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 } as Record<string, number>)[event.key]
  if (!way) return
  event.preventDefault()
  const at = stops.value.indexOf(tabStop.value)
  focusStop(stops.value[(at + way + stops.value.length) % stops.value.length]!)
}
</script>

<template>
  <div class="solitaire" track="wide">
    <div class="solitaire__side">
      <h1 class="solitaire__heading">
        <button ref="headingEl" type="button" class="solitaire__headword" data-press="none"
          :class="{ 'is-waiting': waiting, 'is-placed': headingPlaced, 'is-dragging': dragging(HEADING) }"
          :style="dragStyle(HEADING)" :aria-label="String(HEADING)" :disabled="headingPlaced"
          @pointerdown="grab($event, { from: 'heading' })" @pointermove="pull" @pointerup="drop"
          @pointercancel="drag = undefined" @click="press({ from: 'heading' }, $event)">
          <span v-for="(digit, i) in String(HEADING)" :key="i" class="solitaire__digit" :style="{ '--i': i }"
            aria-hidden="true">{{ digit }}</span>
        </button>
      </h1>
      <p class="solitaire__message">{{ $t('solitaire.message') }}</p>
      <div class="solitaire__actions">
        <NuxtLinkLocale to="/">{{ $t('site.name') }}</NuxtLinkLocale>
        <div class="solitaire__buttons">
          <SiteTooltip v-if="!finished" pass-taps class="solitaire__undo" data-press="none"
            :aria-label="$t('solitaire.undo')" :disabled="!history.length" @click="undo">
            <span class="i-iconoir-undo" aria-hidden="true" />
            <template #tip>{{ $t('solitaire.undo') }}</template>
          </SiteTooltip>
          <SiteTooltip pass-taps class="solitaire__undo" data-press="none" :aria-label="$t('solitaire.reset')"
            :disabled="!history.length" @click="reset">
            <span class="i-iconoir-restart" aria-hidden="true" />
            <template #tip>{{ $t('solitaire.reset') }}</template>
          </SiteTooltip>
        </div>
      </div>
    </div>

    <div class="solitaire__board" role="toolbar" :aria-label="$t('solitaire.board')" @keydown="step">
      <div ref="table" class="solitaire__table" :style="tall">
        <button type="button" class="solitaire__slot solitaire__stock" data-card="stock" data-press="none"
          :aria-label="$t('solitaire.draw')" :title="$t('solitaire.draw')" :tabindex="tabStop === 'stock' ? 0 : -1"
          :disabled="!game.stock.length && !game.waste.length" @click="onDraw">
          <span v-if="!game.stock.length && game.waste.length" class="i-iconoir-refresh" aria-hidden="true" />
        </button>
        <template v-for="pile in PILES" :key="pile.suit">
          <div class="solitaire__slot" :style="{ '--col': 2 + pile.suit }" :data-drop="`pile-${pile.suit}`">{{
            pile.label }}</div>
          <NuxtLinkLocale v-if="finished" :to="pile.to" class="solitaire__door" :class="`suit-${pile.suit}`"
            :style="{ '--col': 2 + pile.suit }">
            {{ $t(pile.name) }}
          </NuxtLinkLocale>
        </template>
        <div v-for="(column, col) in game.columns" :key="col" class="solitaire__slot solitaire__slot--column"
          :style="{ '--col': col }" :data-drop="`column-${col}`">
          <template v-if="!finished">x06</template>
        </div>

        <button v-for="card in cards" :key="card.code" type="button" class="card" data-press="none" :class="[`suit-${suitOf(card.code)}`, {
          'is-up': card.up,
          'is-playable': card.from,
          'is-lifted': lifted.has(card.code),
          'is-dragging': dragging(card.code),
          'is-lit glows-own': finished && card.top === 0 && card.shown,
        }]"
          :style="[{ '--col': card.col, '--top': card.top, '--downs': card.downs, '--ups': card.ups, '--z': card.z }, dragStyle(card.code)]"
          :data-card="card.code" :disabled="!card.from" :tabindex="tabStop === card.code ? 0 : -1"
          :aria-hidden="card.shown ? undefined : 'true'"
          :aria-label="card.shown ? `${card.code} ${REASONS[card.code]}` : undefined"
          @pointerdown="card.from && grab($event, card.from)" @pointermove="pull" @pointerup="drop"
          @pointercancel="drag = undefined" @focus="card.from && (rover = card.code)"
          @click="card.from && press(card.from, $event)">
          <template v-if="card.up">
            <span class="card__code"><span class="card__suit">{{ String(card.code)[0] }}</span>{{
              String(card.code).slice(1) }}</span>
            <span class="card__reason">{{ REASONS[card.code] }}</span>
          </template>
        </button>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{{ said }}</p>
    <Teleport to="body">
      <canvas v-if="bouncing" ref="cascade" class="solitaire__cascade" aria-hidden="true" />
    </Teleport>
  </div>
</template>

<style scoped>
.solitaire {
  display: grid;
  gap: var(--gap-block);
  align-items: start;
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 56rem) {
  .solitaire {
    grid-template-columns: auto minmax(0, 44rem);
    justify-content: space-between;
  }
}

.solitaire__side {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--gap-group);
}

@media (min-width: 56rem) {
  .solitaire__side {
    flex-direction: column;
    align-items: stretch;
  }
}

.solitaire__message {
  order: 1;
  flex-basis: 100%;
}

@media (min-width: 56rem) {
  .solitaire__message {
    order: 0;
    flex-basis: auto;
    max-width: 15rem;
  }
}

.solitaire__heading {
  font-size: clamp(4rem, 12vw, 6rem);
  line-height: 1;
}

.solitaire__headword {
  all: unset;
  display: inline-block;
  position: relative;
  z-index: 500;
  cursor: grab;
  touch-action: none;
  font: inherit;
  font-variation-settings: inherit;
  color: inherit;
  transition: translate 0.26s cubic-bezier(0.16, 1, 0.3, 1), transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s, color 0.6s, text-shadow 0.6s;
}

.solitaire__headword:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.solitaire__headword.is-dragging {
  cursor: grabbing;
  transition: none;
}

.solitaire__headword.is-placed {
  opacity: 0;
  cursor: default;
  transition: none;
}

.solitaire__digit {
  display: inline-block;
}

/* The 404's turn: it comes on, per the Lit Rule, and keeps lifting to be taken. */
.solitaire__headword.is-waiting {
  color: var(--hot);
  text-shadow: var(--glow);
}

@media (prefers-reduced-motion: no-preference) {
  .solitaire__headword.is-waiting:not(.is-dragging) .solitaire__digit {
    animation: solitaire-nudge 4s cubic-bezier(0.65, 0, 0.35, 1) calc(1.2s + var(--i) * 0.1s) infinite;
  }
}

@keyframes solitaire-nudge {

  0%,
  24%,
  100% {
    transform: none;
  }

  8% {
    transform: translateY(-0.14em) rotate(-2.5deg);
  }

  16% {
    transform: translateY(0.02em) rotate(0.5deg);
  }
}

.solitaire__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-group);
}

.solitaire__buttons {
  display: flex;
}

/* SiteTooltip is the button, so its look has to reach through the component. */
.solitaire__buttons :deep(.solitaire__undo) {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  cursor: pointer;
  font-size: 1.25rem;
  text-decoration: none;
  transition: filter 0.25s var(--ease-out), opacity 0.2s, scale 0.25s;
}

.solitaire__buttons :deep(.solitaire__undo:active:not(:disabled)) {
  scale: 0.9;
}

.solitaire__buttons :deep(.solitaire__undo:disabled) {
  opacity: 0.35;
  cursor: default;
}

.solitaire__buttons :deep(.solitaire__undo:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.solitaire__board {
  container-type: inline-size;
}

.solitaire__table {
  --g: clamp(0.25rem, 1.6cqw, 0.75rem);
  --w: calc((100cqw - 4 * var(--g)) / 5);
  --h: calc(var(--w) * 1.32);
  /* Between the top row and the columns. */
  --row: calc(var(--g) * 2);
  --peek-down: clamp(0.5rem, 2.4cqw, 0.875rem);
  --peek-up: clamp(1.5rem, 5cqw, 2.125rem);
  position: relative;
  height: calc(var(--h) * 2 + var(--row) + var(--tall-downs) * var(--peek-down) + var(--tall-ups) * var(--peek-up));
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  font-variation-settings: 'CASL' var(--heading-casual);
  font-variant-numeric: tabular-nums;
  transition: height 0.26s cubic-bezier(0.65, 0, 0.35, 1);
}

.solitaire__slot {
  all: unset;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: calc(var(--col, 0) * (var(--w) + var(--g)));
  width: var(--w);
  height: var(--h);
  padding: 0.3em 0.45em;
  background: color-mix(in srgb, var(--fg) 3%, var(--bg));
  color: var(--slot-ink);
  font-size: clamp(0.875rem, 3cqw, 1.125rem);
}

.solitaire__stock {
  display: grid;
  place-items: center;
  z-index: 60;
  background: transparent;
  cursor: pointer;
  font-size: 1.5rem;
  touch-action: manipulation;
}

.solitaire__stock:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.solitaire__stock:disabled {
  cursor: default;
}

/* Reaches to the table's foot, so a column takes a drop anywhere down it. */
.solitaire__slot--column {
  top: calc(var(--h) + var(--row));
  height: auto;
  bottom: 0;
  background: transparent;
}

.card {
  all: unset;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  z-index: var(--z);
  width: var(--w);
  height: var(--h);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.3em 0.45em;
  overflow: hidden;
  font-size: clamp(0.875rem, 3cqw, 1.125rem);
  line-height: 1.2;
  background: var(--card-back);
  color: var(--card-back-ink);
  outline: 2px solid var(--bg);
  outline-offset: 0;
  transform: translate(calc(var(--col) * (var(--w) + var(--g))),
      calc(var(--top) * (var(--h) + var(--row)) + var(--downs) * var(--peek-down) + var(--ups) * var(--peek-up))) var(--held, );
  transform-origin: top left;
  transition: transform 0.26s cubic-bezier(0.65, 0, 0.35, 1), translate 0.26s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s, box-shadow 0.6s;
}

/* The site's mark, cropped the way the stage crops it, is what makes a card a card and not a slot. */
.card::before {
  --mark: calc(var(--h) * 1.54);
  content: '';
  position: absolute;
  z-index: -1;
  left: calc(100% - var(--mark) * 0.533);
  top: calc(46% - var(--mark) / 2);
  width: var(--mark);
  height: var(--mark);
  background: currentColor;
  opacity: 0.07;
  mask: url('/ax_logo.svg') center / contain no-repeat;
}

.card.is-up {
  box-shadow: inset 0 0 0 1.5px var(--card-edge);
}

.card.is-up.suit-0 {
  background: var(--card-2xx);
  color: var(--card-2xx-ink);
}

.card.is-up.suit-1 {
  background: var(--card-3xx);
  color: var(--card-3xx-ink);
}

.card.is-up.suit-2 {
  background: var(--card-4xx);
  color: var(--card-4xx-ink);
}

.card.is-playable {
  cursor: grab;
  touch-action: none;
}

.card.is-lifted {
  z-index: calc(300 + var(--z));
  /* The same curve on both, or a dropped card swings back toward where it came from first. */
  transition: transform 0.32s cubic-bezier(0.65, 0, 0.35, 1), translate 0.32s cubic-bezier(0.65, 0, 0.35, 1), background-color 0.15s, box-shadow 0.6s;
}

.card.is-dragging {
  z-index: calc(400 + var(--z));
  cursor: grabbing;
  transition: none;
}

.card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  z-index: 250;
}

.card.is-lit {
  box-shadow: inset 0 0 0 1.5px var(--card-edge), var(--glow);
}

.card.is-lit.suit-0 {
  --accent: var(--card-2xx-glow);
}

.card.is-lit.suit-1 {
  --accent: var(--card-3xx-glow);
}

.card.is-lit.suit-2 {
  --accent: var(--card-4xx-glow);
}

/* The suit's digit, heavier: it tells the suits apart where their colors can't
   (a night filter, red-green color blindness). */
.card__code {
  font-weight: 400;
}

.card__suit {
  font-weight: 700;
}

.card__reason {
  display: none;
  font-family: var(--font-body);
  font-weight: 400;
  font-size: 0.6875rem;
  line-height: 1.25;
}

/* With room to spare, the cards stand further apart. */
@container (min-width: 36rem) {
  .solitaire__table {
    --g: 1.5rem;
    --row: 3rem;
  }
}

@container (min-width: 36rem) {
  .card__reason {
    display: block;
  }
}

.card.is-lit .card__reason {
  display: none;
}

/* Once the game's won, each full pile is the way into its section. */
.solitaire__door {
  position: absolute;
  top: 0;
  left: calc(var(--col) * (var(--w) + var(--g)));
  z-index: 200;
  width: var(--w);
  height: var(--h);
  box-sizing: border-box;
  display: flex;
  align-items: flex-end;
  padding: 0.4em 0.45em;
  font-size: clamp(0.75rem, 2.6cqw, 1rem);
}

.solitaire__door.suit-0 {
  color: var(--card-2xx-ink);
}

.solitaire__door.suit-1 {
  color: var(--card-3xx-ink);
}

.solitaire__door.suit-2 {
  color: var(--card-4xx-ink);
}

.solitaire__cascade {
  position: fixed;
  inset: 0;
  z-index: 900;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Held, a card comes up off the table, tipped on its own middle. The 3D is
   only on while it's held: on all 51 it would put each on a layer of its own. */
@media (prefers-reduced-motion: no-preference) {
  .card.is-dragging {
    --held: translate(50%, 50%) perspective(50rem) translateZ(4rem) rotateX(var(--tilt)) translate(-50%, -50%);
    transition: transform 0.18s ease-out;
  }

  .solitaire__headword.is-dragging {
    transform: perspective(50rem) translateZ(4rem) rotateX(var(--tilt));
    transition: transform 0.18s ease-out;
  }
}

@media (prefers-reduced-motion: reduce) {

  .card,
  .solitaire__table,
  .solitaire__headword {
    transition: none;
  }
}
</style>
