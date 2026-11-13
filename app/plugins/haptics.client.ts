import { isHapticClick } from '~/utils/haptics'

/*
 * On iOS a haptic is a click on a hidden switch (utils/haptics.ts), and that
 * click bubbles like any other. The site listens for clicks: a press's spot
 * for the next page, a click outside to put a panel or tooltip away. So it's
 * stopped here, on the window as it comes in, ahead of every listener the
 * components add later. Its default, flipping the switch, still happens.
 */
export default defineNuxtPlugin(() => {
  window.addEventListener('click', (event) => {
    if (isHapticClick(event)) event.stopImmediatePropagation()
  }, { capture: true })
})
