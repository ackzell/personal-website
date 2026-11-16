import { mainNav, socialLinks } from '~/config/nav'
import { matchesTopic } from '~/utils/topicMatch'

/*
 * WebMCP (https://webmachinelearning.github.io/webmcp/): hands a browser's AI
 * agent the same reach the `ackzell` console commands give a person. Browsers
 * without it skip this whole file's work.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // shortcut: the draft moved this to document; navigator is Chrome's earlier trial, drop it once Chrome follows.
  const context = (document as any).modelContext ?? (navigator as any).modelContext
  if (!context?.registerTool) return

  const i18n = nuxtApp.$i18n as { locale: { value: 'en' | 'es' } }
  const router = useRouter()
  const localePath = useLocalePath()
  const pages = mainNav.flatMap((item) => [item.to, ...('children' in item ? item.children.map((child) => child.to) : [])])
  const readOnly = { readOnlyHint: true }

  const tools = [
    {
      name: 'list_projects',
      description: 'Lists the projects Axel (ackzell) has built: name, what the name means, status, stack, repository and page path.',
      annotations: readOnly,
      execute: async () => (await fetchProjects(i18n.locale.value)).map(({ slug, meaning, description, status, stack, repos }) =>
        ({ name: slug, meaning, description, status, stack, repo: repos[0], path: `/projects/${slug}` })),
    },
    {
      name: 'list_uses',
      description: 'Lists the tools, hardware and software Axel uses, by category, with since when.',
      annotations: readOnly,
      execute: () => fetchUses(i18n.locale.value),
    },
    {
      name: 'search_media',
      description: 'Finds Axel\'s YouTube videos and My typeof Radio podcast episodes on a topic. Videos match on their title and playlist; episodes also on their chapter titles, which come back with their start in seconds. Leave the query empty to list everything.',
      annotations: readOnly,
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Topic words, e.g. "vue testing"; all must match.' },
          kind: { type: 'string', enum: ['video', 'podcast'], description: 'Only one kind; both when left out.' },
        },
      },
      execute: async ({ query = '', kind }: { query?: string, kind?: 'video' | 'podcast' }) => {
        const [curation, episodes] = await Promise.all([
          kind === 'podcast' ? undefined : queryCollection('media').first(),
          kind === 'video' ? [] : $fetch<Episode[]>('/api/episodes', { responseType: 'json' }).catch(() => []),
        ])
        const playlists = await Promise.all((curation?.series ?? []).map(async ({ playlist, title }) => {
          const videos = await $fetch<Video[]>(`/api/playlists/${playlist}`, { responseType: 'json' }).catch(() => [])
          return videos.filter((video) => matchesTopic(query, [video.title, title]))
            .map(({ title: videoTitle, url, published }) => ({ kind: 'video', title: videoTitle, playlist: title, url, published }))
        }))
        const found = episodes.filter((episode) => matchesTopic(query, [episode.title, ...episode.chapters.map((chapter) => chapter.title)]))
          .map(({ title, url, published, season, episode, chapters }) => ({
            kind: 'podcast',
            title,
            url,
            published,
            season,
            episode,
            // Only the chapters on the topic, so the agent can point at the moment.
            chapters: query.trim() ? chapters.filter((chapter) => matchesTopic(query, [chapter.title])) : chapters,
          }))
        return [...playlists.flat(), ...found]
      },
    },
    {
      name: 'list_socials',
      description: 'Lists where to find or contact Axel elsewhere: GitHub, YouTube, Bluesky, LinkedIn and more.',
      annotations: readOnly,
      execute: async () => socialLinks.map(({ label, href }) => ({ label, href })),
    },
    {
      name: 'open_page',
      description: `Opens a page of this site in the current tab. Main pages: ${pages.join(', ')}. Project pages are /projects/<name>, from list_projects.`,
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', pattern: '^/[a-z0-9/-]*$', description: 'Site path, e.g. /uses' } },
        required: ['path'],
      },
      execute: async ({ path }: { path: string }) => {
        // The schema is a hint to the agent, not a guarantee: keep navigation on this site.
        if (!/^\/[a-z0-9/-]*$/.test(path)) throw new Error(`Not a site path: ${path}`)
        await router.push(localePath(path))
        return { opened: path }
      },
    },
  ]

  for (const tool of tools) {
    // A failure (permission policy off, name taken after HMR, an older API shape) must not break the page, but should say so.
    Promise.resolve().then(() => context.registerTool(tool)).catch((error) => console.warn(`WebMCP: ${tool.name} not registered`, error))
  }
})
