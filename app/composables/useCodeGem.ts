/**
 * Which tlapalli gem code is colored in (assets/css/tlapalli.css). One choice
 * for every snippet on the site, remembered in this browser. The server and
 * the first client render use the default, so hydration matches; the stored
 * gem takes over once mounted.
 */
// In tlapalli's own order (its themes are numbered 00-07): neutral obsidian first,
// then warm and cool in turn.
export const GEMS = ['obsidian', 'gold', 'turquoise', 'quartz', 'lapis-lazuli', 'amethyst', 'jade', 'fire-opal'] as const
export type Gem = (typeof GEMS)[number]

const DEFAULT_GEM: Gem = 'jade'
const STORAGE_KEY = 'code-gem'

/** The theme's own name: "lapis-lazuli" -> "Lapis Lazuli". */
export const gemName = (gem: Gem) => gem.split('-').map((word) => word[0]!.toUpperCase() + word.slice(1)).join(' ')

const isGem = (value: unknown): value is Gem => GEMS.includes(value as Gem)

export function useCodeGem() {
  const gem = useState<Gem>('code-gem', () => DEFAULT_GEM)

  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isGem(stored)) gem.value = stored
    } catch {
      // Storage blocked (private mode, site data off): the default stays.
    }
  })

  function pick(next: Gem) {
    gem.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Remembered for this visit only.
    }
  }

  return { gem: readonly(gem), pick }
}
