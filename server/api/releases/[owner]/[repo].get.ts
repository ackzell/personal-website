/**
 * A repo's latest GitHub release, or null when it has none. Generated with
 * the site, like /api/contributions, so a version shows as of the last build.
 */
interface GitHubRelease {
  tag_name: string
  html_url: string
  published_at: string
}

export default defineCachedEventHandler(async (event): Promise<Release | null> => {
  const { githubToken } = useRuntimeConfig()
  const repo = `${getRouterParam(event, 'owner')}/${getRouterParam(event, 'repo')}`
  const release = await $fetch<GitHubRelease>(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'ackzell.dev',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    },
  }).catch((error) => {
    // GitHub answers 404 for a repo without releases: no row, not a failed build.
    if (error?.statusCode === 404) return null
    throw error
  })
  return release && { tag: release.tag_name, url: release.html_url, published: localDay(release.published_at) }
}, {
  name: 'release',
  maxAge: 60 * 60,
  getKey: (event) => `${getRouterParam(event, 'owner')}/${getRouterParam(event, 'repo')}`,
})
