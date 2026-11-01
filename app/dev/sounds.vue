<script setup lang="ts">
import { SOUND_SETS, type SoundKind, type SoundSetName } from '~/utils/soundSets'

/*
 * Dev only (registered in nuxt.config.ts): every kind of sound in every set,
 * side by side, to choose the site's by ear. "Use on the site" plays that
 * set on the real pages, in place of the one in utils/sounds.ts, until it's
 * put back.
 */
const sets = Object.keys(SOUND_SETS) as SoundSetName[]

const KINDS: { kind: SoundKind, what: string }[] = [
  { kind: 'tick', what: 'a scrub passing an item, at the size below' },
  { kind: 'detent', what: 'a drag reaching where letting go acts' },
  { kind: 'undo', what: 'the drag coming back short' },
  { kind: 'edge', what: 'a swipe with nowhere to go' },
  { kind: 'toggle', what: 'color scheme, language' },
  { kind: 'go', what: 'a flag band or next/prev stop tap to another page' },
  { kind: 'lift', what: 'a sticker picked up' },
  { kind: 'role', what: 'a role reaching the reading line' },
  { kind: 'draw', what: 'a uses table drawing in' },
  { kind: 'type', what: 'the uses queries typing in together' },
  { kind: 'key', what: 'the contributions command typing in' },
  { kind: 'enter', what: 'and run' },
  { kind: 'print', what: 'a row of its log printed' },
  { kind: 'forward', what: 'to a later section' },
  { kind: 'back', what: 'to an earlier section' },
  { kind: 'open', what: 'the media guide panel coming in' },
  { kind: 'close', what: 'and away' },
  { kind: 'reveal', what: 'the lightbox opening' },
  { kind: 'conceal', what: 'and closing' },
  { kind: 'swap', what: 'another pick in the open side panel' },
  { kind: 'peek', what: 'a tooltip coming out' },
  { kind: 'point', what: 'the mouse on another project, release or month' },
  { kind: 'on', what: 'sound switched on' },
  { kind: 'off', what: 'and off' },
  { kind: 'ink', what: 'the landing mark\'s ring inking in' },
  { kind: 'angle', what: 'the A\'s angle drawn up and over' },
  { kind: 'cross', what: 'its stroke across passing the A' },
  { kind: 'glow', what: 'and the mark glowing' },
  { kind: 'part', what: 'the landing text parting around the mark' },
]

const size = ref(0.5)
const playing = ref<SoundSetName>()
const using = ref<SoundSetName>()
onMounted(() => (using.value = soundSet()))

let timers: ReturnType<typeof setTimeout>[] = []
function stop() {
  timers.forEach(clearTimeout)
  timers = []
  playing.value = undefined
}
onBeforeUnmount(stop)

function sequence(set: SoundSetName, steps: [SoundKind, number?][], gap: number) {
  stop()
  playing.value = set
  steps.forEach(([kind, at], i) => timers.push(setTimeout(() => playFrom(set, kind, at), i * gap)))
  timers.push(setTimeout(() => (playing.value = undefined), steps.length * gap))
}

// A finger run along a strip: items of all sizes, one after another.
const SCRUB = [0.2, 0.9, 0.5, 0.1, 0.7, 0.35, 1, 0.05, 0.6, 0.3]
const scrub = (set: SoundSetName) => sequence(set, SCRUB.map((at) => ['tick', at]), 110)
// The footer's socials, swept left to right (SiteFooter.vue).
const SOCIALS = [277.18, 440, 277.18, 293.66, 329.63, 415.3]
function socials(set: SoundSetName) {
  stop()
  playing.value = set
  SOCIALS.forEach((hz, i) => timers.push(setTimeout(() => playNoteFrom(set, hz), i * 160)))
  timers.push(setTimeout(() => (playing.value = undefined), SOCIALS.length * 160))
}
// A word writing itself under the pointer.
function word(set: SoundSetName) {
  stop()
  playing.value = set
  const letters = 8
  for (let i = 0; i < letters; i++) timers.push(setTimeout(() => playLetterFrom(set, i / (letters - 1)), i * 35))
  timers.push(setTimeout(() => (playing.value = undefined), letters * 35))
}
// The header and a page's headings switching language: rows down the screen.
const BOARD_ROWS = [
  { at: 0, chars: 6, pan: -0.8 }, { at: 0, chars: 5, pan: 0.2 }, { at: 0, chars: 8, pan: 0.5 },
  { at: 0.05, chars: 18, pan: -0.4 }, { at: 0.1, chars: 32, pan: -0.2 }, { at: 0.18, chars: 12, pan: -0.5 },
].map((row) => ({ ...row, step: 1 / 40, settle: 0.3 }))
// The footer's color-scheme="system" turning to light, then dark.
const CLOCK_ROW = { at: 0, chars: 6, step: 1 / 40, settle: 0.3, pan: 0.6 }
function clock(set: SoundSetName) {
  stop()
  playing.value = set
  playClockFrom(set, CLOCK_ROW, 1)
  timers.push(setTimeout(() => playClockFrom(set, { ...CLOCK_ROW, chars: 5 }, 0), 700))
  timers.push(setTimeout(() => (playing.value = undefined), 1400))
}
const all = (set: SoundSetName) => sequence(set, KINDS.map(({ kind }) => [kind, size.value]), 550)

function use(set: SoundSetName) {
  auditionSet(set)
  using.value = soundSet()
}
</script>

<template>
  <div class="page audition">
    <h1>Sound audition</h1>
    <p class="audition__note">
      Dev only. Each column is a set; the site plays the one marked in use. Tap anything once first: browsers keep
      audio off until then.
    </p>
    <label class="audition__size">
      size <input v-model.number="size" type="range" min="0" max="1" step="0.05"> <code>{{ size.toFixed(2) }}</code>
    </label>

    <table>
      <thead>
        <tr>
          <th scope="col">kind</th>
          <th v-for="set in sets" :key="set" scope="col">
            {{ set }}
            <span v-if="using === set" class="audition__using">in use</span>
          </th>
        </tr>
        <tr>
          <td />
          <td v-for="set in sets" :key="set" class="audition__actions">
            <button type="button" @click="playing === set ? stop() : all(set)">
              {{ playing === set ? 'stop' : 'play all' }}
            </button>
            <button type="button" @click="scrub(set)">scrub</button>
            <button type="button" @click="socials(set)">socials</button>
            <button type="button" @click="word(set)">word</button>
            <button type="button" @click="playBoardFrom(set, BOARD_ROWS)">language</button>
            <button type="button" @click="clock(set)">scheme</button>
            <button v-for="way in (['up', 'down', 'left', 'right'] as const)" :key="way" type="button"
              @click="playScanFrom(set, way)">scan {{ way }}</button>
            <button type="button" @click="playTableFrom(set, 4, 0.07)">table</button>
            <button type="button" @click="playSlideFrom(set, -0.7, 0.5)">slide long</button>
            <button type="button" @click="playSlideFrom(set, 0.1, 0.25)">slide short</button>
            <button type="button" :disabled="using === set" @click="use(set)">use on the site</button>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ kind, what } in KINDS" :key="kind">
          <th scope="row">
            <code>{{ kind }}</code>
            <span>{{ what }}</span>
          </th>
          <td v-for="set in sets" :key="set">
            <button type="button" :aria-label="`${kind}, ${set}`" @click="playFrom(set, kind, size)">play</button>
          </td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<style scoped>
.audition {
  padding-block: var(--space-6, 3rem);
  font-family: var(--font-code);
  font-size: 0.875rem;
}

.audition h1 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.audition__note {
  max-width: 60ch;
  color: var(--muted);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-block: 1.5rem;
}

th,
td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid color-mix(in oklab, var(--fg) 12%, transparent);
  text-align: start;
  vertical-align: baseline;
}

tbody th {
  font-weight: inherit;
}

tbody th span {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
}

.audition__using {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: normal;
}

.audition__actions {
  display: table-cell;
}

.audition__actions button {
  display: block;
  margin-block: 0.15rem;
}

button {
  padding: 0.35rem 0.6rem;
  border: 1px solid color-mix(in oklab, var(--fg) 25%, transparent);
  border-radius: 0.25rem;
  background: none;
  font: inherit;
  color: var(--fg);
  cursor: pointer;
}

button:disabled {
  opacity: 0.4;
  cursor: default;
}

.audition__size {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
</style>
