const SOURCE = 'https://github.com/ackzell/personal-website'

/*
 * For whoever opens the devtools: the flag in this scheme's colors, what this
 * page really cost to load, then `ackzell` to poke at. The commands fetch
 * on demand, so a visitor who never types one doesn't download the content.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { t: (key: string) => string, locale: { value: 'en' | 'es' } }
  const { commit } = useRuntimeConfig().public

  const greet = () => {
    const root = getComputedStyle(document.documentElement)
    const color = (name: string) => root.getPropertyValue(name)
    const { classList } = document.documentElement
    const dark = classList.contains('dark')
    const vivid = classList.contains('vivid')

    // The whole message is the flag: a third of its characters per stripe.
    const message = [...(i18n.t('console.message') || 'ackzell.dev')]
    const third = Math.ceil(message.length / 3)
    const stripes = [0, 1, 2].map((i) => `%c${message.slice(i * third, (i + 1) * third).join('')}`).join('')

    // Dark's stripes are lit, and vivid's middle one silver: both want ink.
    const stripe = (name: string) => [color(`--field-${name}`), color(dark || (vivid && name === 'work') ? '--softflag-ink' : '--softflag-paper')]
    const [about, onAbout] = stripe('about')
    const [work, onWork] = stripe('work')
    const [media, onMedia] = stripe('media')
    // The outer stripes fade over padding of their own, so no text sits on the console's background.
    const fade = '4em'
    console.log(
      stripes,
      `padding: 2px 0 2px ${fade}; color: ${onAbout}; background: linear-gradient(to right, transparent, ${about} ${fade});`,
      `padding: 2px 0; color: ${onWork}; background: ${work};`,
      `padding: 2px ${fade} 2px 0; color: ${onMedia}; background: linear-gradient(to left, transparent, ${media} ${fade});`,
    )

    const [page] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const files = [page!, ...performance.getEntriesByType('resource') as PerformanceResourceTiming[]]
    const kilobytes = (size: 'transferSize' | 'decodedBodySize') =>
      `${Math.round(files.reduce((total, file) => total + file[size], 0) / 1024)} KB`
    console.table({
      requests: files.length,
      transferred: kilobytes('transferSize'),
      unpacked: kilobytes('decodedBodySize'),
      loaded: `${Math.round(page!.loadEventEnd)} ms`,
      cookies: document.cookie ? document.cookie.split(';').length : 0,
      commit: commit.slice(0, 7) || 'dev',
    })

    const command = 'font-family: monospace; font-weight: bold;'
    console.log(`${i18n.t('console.hint')} %cackzell.projects%c, %cackzell.uses%c, %cackzell.intro`, command, '', command, '', command)

    console.log(i18n.t('console.stack'))
    console.log(commit ? `${SOURCE}/tree/${commit}` : SOURCE)

    console.log(`${i18n.t('console.v1')} https://v1.ackzell.dev`)

    console.log(i18n.t('console.lost'))
  }

  Object.assign(window, {
    ackzell: {
      get projects() {
        return void fetchProjects(i18n.locale.value).then((projects) => console.table(
          projects.map(({ word, meaning, status, stack, repos }) => ({ word, meaning, status, stack: stack.join(', '), repo: repos[0] ?? '' })),
        ))
      },
      get uses() {
        return void fetchUses(i18n.locale.value).then((categories) => {
          for (const { name, tools } of categories) {
            console.group(name)
            console.table(tools.map(({ name, since, until, note }) => ({ name, since, until: until ?? '', note: note ?? '' })))
            console.groupEnd()
          }
        })
      },
      /*
       * With sound on, the mark and the header and footer build again right
       * here, each piece heard as it lands: a command typed here lets the
       * page play sound, and a reload would lose that. Otherwise it forgets
       * the first visit (plugins/intro.client.ts) and loads again, so it
       * plays as it first did.
       */
      get intro() {
        if (soundIsOn() && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const root = document.documentElement
          root.dataset.intro = ''
          // The landing mark draws itself in again, as for sound switched on (useMarkEntrance).
          setSoundOn(true)
          buildIntro(cssTime('--intro-at'))
          return undefined
        }
        try {
          localStorage.removeItem(INTRO_SEEN)
        } catch {
          // Storage blocked: there was never an intro to forget.
        }
        location.reload()
        return undefined
      },
    },
  })

  onNuxtReady(() => {
    if (document.readyState === 'complete') greet()
    // A tick later, or the load event's own end isn't timed yet.
    else addEventListener('load', () => setTimeout(greet), { once: true })
  })
  // The greeting was printed in the old language: say it again in the new one.
  watch(() => i18n.locale.value, greet)
})
