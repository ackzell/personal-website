<script setup lang="ts">
/* `drawn` masks the mark with pen strokes that whoever places it can draw
   in: one per arc of the ring (.glyph-pen-ring), then for the A one per leg
   (.glyph-pen-left, .glyph-pen-right) and one for the stroke across it
   (.glyph-pen-cross). Left alone, the masks show the mark whole. */
defineProps<{ drawn?: boolean }>()

const id = useId()
</script>

<template>
  <!-- The ax mark itself: a ring split at both sides around the A. Sized and
       colored by whoever places it (fill follows currentColor). -->
  <svg viewBox="0 0 446.89362 446.94595" fill="currentColor" focusable="false">
    <g transform="translate(729.90324,45.938115)">
      <g transform="matrix(1.8014244,0,0,1.8014244,-739.47695,-53.091653)">
        <template v-if="drawn">
          <!-- Along the middle of the band, gap to gap, wider than the band:
               over the top left to right, under the bottom right to left. -->
          <mask :id="`${id}-ring`">
            <g fill="none" stroke="white" stroke-width="36">
              <path class="glyph-pen-ring" d="M 18.85 128 A 110.5 110.5 0 0 1 239.85 128" />
              <path class="glyph-pen-ring" d="M 239.85 128 A 110.5 110.5 0 0 1 18.85 128" />
            </g>
          </mask>
          <!-- Each leg's pen keeps to its side of the A's axis (the left one
               a hair over, so they meet without a seam) and off the stroke
               across, the bar between the legs and the blade past the right
               one, so a leg never uncovers a stub of it. The stroke across
               comes last, so its pen needs no bounds. -->
          <clipPath :id="`${id}-left`">
            <path d="M -10 -10 H 136.5 L 126.5 250 H -10 Z" />
          </clipPath>
          <clipPath :id="`${id}-right`">
            <path d="M 135.5 -10 H 270 V 250 H 125.5 Z" />
          </clipPath>
          <clipPath :id="`${id}-legs`">
            <path clip-rule="evenodd"
              d="M -10 -10 H 270 V 250 H -10 Z M 110.96 149.23 L 139.17 125.62 L 143.8 146.48 L 95.2 199.6 Z M 156.1 110 L 230 50 L 240 140 L 162 130 Z" />
          </clipPath>
          <!-- Along the middle of each stroke, past its ends: up the left leg,
               down the right one, then from the left foot out to the blade's
               tip. -->
          <mask :id="`${id}-a`">
            <g fill="none" stroke="white" stroke-width="50">
              <g :clip-path="`url(#${id}-legs)`">
                <path class="glyph-pen-left" :clip-path="`url(#${id}-left)`" d="M 76 230 L 139.4 10" />
                <path class="glyph-pen-right" :clip-path="`url(#${id}-right)`" d="M 129.3 10 L 177 232" />
              </g>
              <path class="glyph-pen-cross" d="M 88 200 L 215 66" />
            </g>
          </mask>
        </template>
        <path class="glyph-ring" :mask="drawn ? `url(#${id}-ring)` : undefined"
          d="M 128.55107,3.9710454 C 67.661754,4.354953 17.142091,48.322937 6.8274099,106.15484 H 34.654491 C 44.60246,63.182927 83.221054,31.150685 129.34888,31.150685 c 46.12779,0 84.75563,32.032242 94.70364,75.004155 h 27.82704 C 241.50968,48.067043 190.59585,3.9710454 129.34888,3.9710454 c -0.26592,0 -0.53184,0 -0.79781,0 z M 5.3145239,138.24192 c 5.2079121,63.73577 58.7531691,113.83609 124.0343561,113.83609 65.29039,0 118.82645,-50.10032 124.04356,-113.83609 H 226.0054 c -5.11601,48.70214 -46.43953,86.65663 -96.65652,86.65663 -50.207962,0 -91.531255,-37.95449 -96.647445,-86.65663 z" />
        <path class="glyph-a" :mask="drawn ? `url(#${id}-a)` : undefined"
          d="M 133.79573,34.276166 66.139802,198.86138 c 9.352084,8.30737 20.363616,14.79602 32.475593,18.90858 l -3.878426,-20.62684 48.520831,-53.0978 16.37538,73.88008 c 8.8477,-2.96106 17.11796,-7.18325 24.59045,-12.44731 L 160.55001,125.1184 206.28362,75.082081 157.29515,114.06927 Z m -2.46646,55.940182 8.38025,37.835692 -29.56901,23.53302 z" />
      </g>
    </g>
  </svg>
</template>
