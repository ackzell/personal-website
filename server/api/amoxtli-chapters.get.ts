/**
 * What's written of Amoxtli so far, read from its public repository when the
 * site is generated, so the published page carries the book as of the last
 * build. One API call for the file list; the sources come from the raw host,
 * which that rate limit doesn't count.
 */
const repo = 'ackzell/amoxtli-vue-2'

export default defineCachedEventHandler(async (): Promise<BookChapters> => {
  const { githubToken } = useRuntimeConfig()
  const { tree } = await $fetch<{ tree: { path: string }[] }>(`https://api.github.com/repos/${repo}/git/trees/main`, {
    query: { recursive: 1 },
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'ackzell.dev',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    },
  })

  const pages = await Promise.all(tree.filter(({ path }) => isBookPage(path)).map(async ({ path }) => ({
    path,
    source: await $fetch<string>(`https://raw.githubusercontent.com/${repo}/main/${path}`, { responseType: 'text' }),
  })))

  return bookChapters(pages)
}, { name: 'amoxtli-chapters', maxAge: 60 * 60 })
