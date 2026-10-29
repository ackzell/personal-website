<script setup lang="ts">
/**
 * A project's facts, set like the fields under a dictionary entry: a quiet
 * label, then the value. Every row comes from metadata and only shows when
 * its field is filled, so a sparse project gets a short ledger, never empty
 * labels. This is the scan path: what it is, where it lives, what it's made of.
 */
const props = defineProps<{ project: ProjectFacts }>()

const { t } = useI18n()

type Item = { label: string, href?: string, muted?: string, icon?: string }
type Row = { key: string, label: string, items: Item[] }

/* A brand mark for a stack entry, by the slug the project's metadata uses.
   Classes are spelled out whole, and here rather than in a util: UnoCSS only
   generates the icons it finds written in files it scans, and plain .ts isn't
   one. Entries without a mark (mostly the project's own niche tools) get a
   quiet generic one, so the run keeps its rhythm. */
const marks: Record<string, string> = {
  'nuxt': 'i-simple-icons-nuxt',
  'vue': 'i-simple-icons-vuedotjs',
  'vite': 'i-simple-icons-vite',
  'electron': 'i-simple-icons-electron',
  'typescript': 'i-simple-icons-typescript',
  'pinia': 'i-simple-icons-pinia',
  'unocss': 'i-simple-icons-unocss',
  'zed': 'i-simple-icons-zedindustries',
}
const stackIcon = (slug: string) => marks[slug] ?? 'i-iconoir-package'

const host = (url: string) => new URL(url).host

// Owner and repo apart, so the repo name leads and the owner stays quiet.
const repoItem = (repo: string): Item => {
  const [owner, name] = repo.split('/')
  return { label: name ?? repo, muted: name ? `${owner}/` : undefined, href: `https://github.com/${repo}` }
}

const rows = computed<Row[]>(() => {
  const { links, repos, stack, devlogPlaylist } = props.project
  const all: Row[] = [
    { key: 'site', label: t('projects.ledger.site'), items: links.site ? [{ label: host(links.site), href: links.site }] : [] },
    {
      key: 'install',
      label: t('projects.ledger.install'),
      items: [
        ...(links.marketplace ? [{ label: 'VS Code Marketplace', href: links.marketplace }] : []),
        ...(links.openvsx ? [{ label: 'Open VSX', href: links.openvsx }] : []),
      ],
    },
    { key: 'release', label: t('projects.ledger.release'), items: links.release ? [{ label: host(links.release), href: links.release }] : [] },
    { key: 'source', label: t('projects.ledger.source'), items: repos.map(repoItem) },
    { key: 'video', label: t('projects.ledger.video'), items: links.video ? [{ label: host(links.video), href: links.video }] : [] },
    {
      key: 'devlog',
      label: t('projects.ledger.devlog'),
      items: devlogPlaylist ? [{ label: 'YouTube', href: `https://www.youtube.com/playlist?list=${devlogPlaylist}` }] : [],
    },
    // Invite-only previews: a way to ask, never the preview itself.
    {
      key: 'access',
      label: t('projects.ledger.access'),
      items: links.previewAccess ? [{ label: t('projects.ledger.requestAccess'), href: links.previewAccess }] : [],
    },
    { key: 'stack', label: t('projects.ledger.stack'), items: stack.map((label) => ({ label, icon: stackIcon(label) })) },
  ]
  return all.filter((row) => row.items.length)
})
</script>

<template>
  <dl v-if="rows.length" class="ledger" m="0" data-own-entrance>
    <div v-for="(row, r) in rows" :key="row.key" class="ledger__row" :style="{ '--row': r }">
      <dt class="ledger__label running-head">{{ row.label }}</dt>
      <dd class="ledger__value" m="0">
        <ul class="ledger__items" m="0" p="0" list="none">
          <li v-for="(item, i) in row.items" :key="item.label" :style="{ '--i': i }">
            <a v-if="item.href" :href="item.href" class="ledger__link">
              <span v-if="item.muted" class="ledger__muted">{{ item.muted }}</span>{{ item.label }}<span
                class="ledger__out i-iconoir-arrow-up-right" aria-hidden="true" />
            </a>
            <span v-else>
              <span v-if="item.icon" class="ledger__mark" :class="item.icon" aria-hidden="true" />{{ item.label }}
            </span>
          </li>
        </ul>
      </dd>
    </div>
  </dl>
</template>

<style scoped>
/* Labels share one column, sized by the longest, so values start on one
   line down the ledger like a dictionary's field names. */
.ledger {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--gap-tight) var(--gap-block);
}

.ledger__row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
}

.ledger__items {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--gap-group);
}

/* Plain values read as a run, set apart by a middle dot; the stack's marks
   set its entries apart instead. */
.ledger__items>li+li:not(:has(a, .ledger__mark))::before {
  content: '·';
  margin-inline-end: var(--gap-group);
  color: var(--muted);
}

.ledger__mark {
  margin-inline-end: 0.4em;
  color: var(--muted);
}

/*
 * Entrance: in place of the page's block rise (ProjectPage.vue), the ledger
 * fills in row by row, from where the block would have arrived (the third
 * block, 310ms), each sliding in from its label, so it reads as being
 * written up rather than dropped in. The stack's marks pop in one after
 * another as their row lands.
 */
@media (prefers-reduced-motion: no-preference) {
  .ledger__row {
    --row-start: calc(310ms + var(--row) * 70ms);
    --lift-from: calc(-1 * var(--space-4)) 0;
    animation:
      400ms var(--ease-out) var(--row-start) backwards vt-develop,
      var(--arrive-duration) var(--ease-arrive) var(--row-start) backwards vt-lift;
  }

  .ledger__mark {
    animation: var(--pop-duration) var(--ease-pop) calc(var(--row-start) + 200ms + var(--i) * 50ms) backwards ledger-pop;
  }
}

@keyframes ledger-pop {
  from {
    scale: 0;
  }
}

.ledger__link {
  text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
  text-underline-offset: 0.25em;
  transition: text-decoration-color 160ms var(--ease-out);
}

.ledger__link:hover {
  text-decoration-color: currentColor;
}

.ledger__muted {
  color: var(--muted);
}

/* The arrow says it leaves the site; it nudges out the way it points. */
.ledger__out {
  margin-inline-start: 0.2em;
  font-size: 0.85em;
  transition: translate 200ms var(--ease-out);
}

.ledger__link:hover .ledger__out {
  translate: 0.12em -0.12em;
}

@media (prefers-reduced-motion: reduce) {
  .ledger__out {
    transition: none;
  }
}

/* Narrow screens: the label sits above its value. */
@media (width < 40rem) {
  .ledger {
    grid-template-columns: 1fr;
    gap: var(--gap-group);
  }
}
</style>
