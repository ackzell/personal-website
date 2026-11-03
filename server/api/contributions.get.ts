/**
 * Merged pull requests to repositories that aren't mine, from GitHub's
 * search. Runs when the site is generated, so the published pages carry the
 * list as of the last build. One page of 100 covers them all for now.
 *
 * Unauthenticated search allows 10 requests a minute, plenty for a build;
 * set NUXT_GITHUB_TOKEN to lift it.
 */
const query = 'is:pr is:merged author:ackzell -user:ackzell'

interface SearchItem {
  number: number
  title: string
  html_url: string
  repository_url: string
  pull_request?: { merged_at: string | null }
}

export default defineCachedEventHandler(async (): Promise<Contribution[]> => {
  const { githubToken } = useRuntimeConfig()
  const { items } = await $fetch<{ items: SearchItem[] }>('https://api.github.com/search/issues', {
    query: { q: query, per_page: 100 },
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'ackzell.dev',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    },
  })

  return items.flatMap((item) => {
    const merged = item.pull_request?.merged_at
    if (!merged) return []
    const repo = item.repository_url.replace('https://api.github.com/repos/', '')
    return [{
      id: `${repo}#${item.number}`,
      repo,
      number: item.number,
      title: item.title,
      url: item.html_url,
      merged: localDay(merged),
    }]
  })
}, { name: 'contributions', maxAge: 60 * 60 })
