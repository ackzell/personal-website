const SOURCE = 'https://github.com/ackzell/personal-website'

/*
 * For whoever opens the devtools: the flag in this scheme's colors, then what
 * this page really cost to load, then `ackzell` to poke at. The commands fetch
 * on demand, so a visitor who never types one doesn't download the content.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as { t: (key: string) => string, locale: { value: 'en' | 'es' } }
  const { commit } = useRuntimeConfig().public

  const greet = () => {
    const root = getComputedStyle(document.documentElement)
    const stage = getComputedStyle(document.body)
    const box = 'padding: 2px 0;'
    const stripe = (field: string) => `${box} background: ${root.getPropertyValue(field)};`
    console.log(
      `%c  %c  %c  %c ${i18n.t('console.message') || 'ackzell.dev'} `,
      stripe('--field-about'),
      stripe('--field-work'),
      stripe('--field-media'),
      `${box} background: ${stage.backgroundColor}; color: ${stage.color};`,
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

    console.log(`ackzell.projects\nackzell.uses\n${commit ? `${SOURCE}/tree/${commit}` : SOURCE}`)
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
    },
  })

  onNuxtReady(() => {
    if (document.readyState === 'complete') greet()
    // A tick later, or the load event's own end isn't timed yet.
    else addEventListener('load', () => setTimeout(greet), { once: true })
  })
})
