import { defineCollection, defineContentConfig, z } from '@nuxt/content'

/**
 * Projects are split in two:
 * - `content/projects/<slug>.yml`: language-agnostic metadata (one file per project).
 * - `content/<locale>/projects/<slug>.md`: translated copy and the case study body.
 * The file name is the slug, and it is also the Nahuatl word the project is named after.
 */

const projectCopy = z.object({
  // Translation of the Nahuatl word.
  meaning: z.string(),
})

export default defineContentConfig({
  collections: {
    projectsMeta: defineCollection({
      type: 'data',
      source: 'projects/*.yml',
      schema: z.object({
        pronunciation: z.string(),
        status: z.enum(['shipped', 'active', 'experiment']),
        featured: z.boolean().default(false),
        order: z.number(),
        repos: z.array(z.string()).default([]),
        links: z
          .object({
            site: z.string().url(),
            video: z.string().url(),
            marketplace: z.string().url(),
            openvsx: z.string().url(),
            release: z.string().url(),
            previewAccess: z.string(),
          })
          .partial()
          .default({}),
        stack: z.array(z.string()).default([]),
        related: z.array(z.string()).default([]),
        // YouTube playlist with livestreams / progress updates.
        devlogPlaylist: z.string().optional(),
      }),
    }),

    projects_en: defineCollection({
      type: 'page',
      source: { include: 'en/projects/*.md', prefix: '/projects' },
      schema: projectCopy,
    }),

    projects_es: defineCollection({
      type: 'page',
      source: { include: 'es/projects/*.md', prefix: '/projects' },
      schema: projectCopy,
    }),
  },
})
