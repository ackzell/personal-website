<script setup lang="ts">
/**
 * A project's facts, set like the fields under a dictionary entry: a quiet
 * label, then the value. Every row comes from metadata and only shows when
 * its field is filled, so a sparse project gets a short ledger, never empty
 * labels. This is the scan path: what it is, where it lives, what it's made of.
 */
const props = defineProps<{ project: ProjectFacts }>()

const { t } = useI18n()

type Item = { label: string, href?: string, muted?: string }
type Row = { key: string, label: string, items: Item[] }

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
    { key: 'stack', label: t('projects.ledger.stack'), items: stack.map((label) => ({ label })) },
  ]
  return all.filter((row) => row.items.length)
})
</script>

<template>
  <dl v-if="rows.length" class="ledger" m="0">
    <div v-for="row in rows" :key="row.key" class="ledger__row">
      <dt class="ledger__label running-head">{{ row.label }}</dt>
      <dd class="ledger__value" m="0">
        <ul class="ledger__items" m="0" p="0" list="none">
          <li v-for="item in row.items" :key="item.label">
            <a v-if="item.href" :href="item.href" class="ledger__link">
              <span v-if="item.muted" class="ledger__muted">{{ item.muted }}</span>{{ item.label }}<span
                class="ledger__out i-iconoir-arrow-up-right" aria-hidden="true" />
            </a>
            <span v-else>{{ item.label }}</span>
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

/* Plain values (the stack) read as a run, set apart by a middle dot. */
.ledger__items > li + li:not(:has(a))::before {
  content: '·';
  margin-inline-end: var(--gap-group);
  color: var(--muted);
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
