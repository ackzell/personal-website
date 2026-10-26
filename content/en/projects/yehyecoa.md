---
title: "Yehyecoa"
description: "A focused Vue playground for rehearsing code together."
meaning: "to try; to experiment; to rehearse"
---

My own spin on the Vue Playground, built to run inside the lessons of Amoxtli. It leaves out the version picker and the compiled output, so a learner sees only their component and what it renders. It's right here: change the code and the preview follows.

::media-site{src="https://yehyecoa-vue.ackzell.dev" title="Yehyecoa, the Vue playground" poster="/media/yehyecoa-vue/site-dark.webp" posterLight="/media/yehyecoa-vue/site-light.webp" posterNarrow="/media/yehyecoa-vue/site-narrow-dark.webp" posterNarrowLight="/media/yehyecoa-vue/site-narrow-light.webp" wide}
On its own here, with no workshop to join. Snapshots stay in your browser.
::

What this page can't show is the room. In a workshop an instructor broadcasts, and every student's editor follows along live, edits, selections and scrolling included, in whichever theme they prefer. Every try can be saved as a snapshot, compared against the current code and restored.

::media-palette{dir="/media/yehyecoa-vue" width="1440" height="810" label="Yehyecoa's features"}
---
items:
  - id: promo
    name: promo
    label: The promo video, without its music. The name types in, then the playground, live sync and snapshots in turn.
  - id: live-edit
    name: live edit
    label: A title edited in the editor; the preview beside it updates as it's typed.
  - id: console
    name: console
    label: The preview's button clicked three times; each click logs a line in the console below it.
  - id: dock
    name: dock
    label: The console dragged by its header over the editor and dropped under it, leaving the preview full height.
  - id: broadcast
    name: broadcast
    label: The instructor's window broadcasting. They edit the title and a value, select a function, then scroll to the styles.
  - id: follow
    name: follow
    label: A student's window in the light theme, following the instructor. The same edits, selections and scrolling arrive live.
  - id: history
    name: snapshots
    label: The snapshot drawer opened, a snapshot compared side by side with the current code, then restored.
  - id: changelog
    name: changelog
    label: The version in the footer clicked, opening a sheet with what changed in each release.
---
::

::media-stills{dir="/media/yehyecoa-vue/stills" width="1920" height="1080" label="Yehyecoa's screens"}
---
items:
  - src: focus-hero
    alt: The playground in dark mode, the file list, the editor with App.vue and the rendered preview side by side.
  - src: console-dock-docked
    alt: The console docked under the editor, with the preview taking the full height.
  - src: together-instructor-broadcast
    alt: The instructor's window while broadcasting, with a block of styles selected.
  - src: together-student-light-sync
    alt: A student's window in the light theme, marked as following the instructor.
  - src: safety-diff-view
    alt: A side-by-side diff between the current code and a saved snapshot, over the snapshot drawer.
  - src: changelog-sheet
    alt: The changelog sheet open over the playground, listing three beta releases.
---
::
