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

// Copy that differs per locale, kept beside the data it describes.
const localized = <T extends z.ZodTypeAny>(schema: T) => z.object({ en: schema, es: schema })

// A month, as `YYYY-MM`.
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

export default defineContentConfig({
  collections: {
    /**
     * Roles, one file per company: `content/experience/<slug>.yml`.
     * Dates and stack are shared; role and summary carry both locales, since
     * the copy is short and the pairs are easier to keep in step side by side.
     */
    experience: defineCollection({
      type: 'data',
      source: 'experience/*.yml',
      schema: z.object({
        company: z.string(),
        url: z.string().url().optional(),
        start: month,
        end: month,
        role: localized(z.string()),
        summary: localized(z.array(z.string())),
        stack: z.array(z.string()).default([]),
      }),
    }),

    /**
     * Curation for the merged pull requests fetched from GitHub
     * (server/api/contributions.get.ts), by `owner/repo#number`.
     */
    contributions: defineCollection({
      type: 'data',
      source: 'contributions.yml',
      schema: z.object({
        errata: z.array(z.string()).default([]),
        hidden: z.array(z.string()).default([]),
        notes: z.record(z.string(), localized(z.string())).default({}),
      }),
    }),

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
        // The project's mark, served from public/ (e.g. /logos/tlapalli.svg).
        logo: z.string().optional(),
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
