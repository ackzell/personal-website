---
title: "Yehyecoa"
description: "A focused Vue playground for rehearsing code together."
meaning: "to try; to experiment; to rehearse"
pronunciation: "yeh-yeh-CO-ah"
---

My own spin on the Vue Playground, originally built to run inside the lessons of [Amoxtli Vue](/projects/amoxtli). It leaves out the version picker and the compiled output, so a learner sees only their component and what it renders. The premise is the same: based on the Vue [repl](https://github.com/vuejs/repl) official component. I added support for the console as well as the snapshots. And something else...

::media-site{src="https://yehyecoa-vue.ackzell.dev" title="Yehyecoa, the Vue playground" poster="/media/yehyecoa-vue/site-dark.webp" posterLight="/media/yehyecoa-vue/site-light.webp" posterNarrow="/media/yehyecoa-vue/site-narrow-dark.webp" posterNarrowLight="/media/yehyecoa-vue/site-narrow-light.webp" wide}
On its own here, with no workshop to join. Snapshots stay in your browser.
::

That something else is the room, the one thing this page can't show. In a workshop, an instructor broadcasts code through the REPL and every student's editor follows along live: edits, selections and scrolling included, in whichever theme each student prefers, even if it is in the middle of the explanation. 

The idea is that as an instructor you can live code an example or a concept you are trying to teach, and your students see exactly what you're doing, but can also play with that code on their own machine whenever they want to. 

Every try can be saved as a snapshot, compared against the current code and be restored. Hopefully that makes for a more immersive workshop, and stays true to the meaning of the name: to try, to experiment, to rehearse.

::media-palette{dir="/media/yehyecoa-vue" width="1440" height="810" label="Yehyecoa's features"}
---
items:
  - id: video
    name: video
    label: An experiment on an AI-generated video for the project.
    caption: An experiment on an AI-generated video for the project.
    video: https://youtu.be/XD68rXTeyMQ
  - id: live-edit
    name: live edit
    label: A title edited in the editor; the preview beside it updates as it's typed.
    caption: You make a change on the editor and the preview gets automagically updated.
  - id: console
    name: console
    label: The preview's button clicked three times; each click logs a line in the console below it.
    caption: See what the console.log() call outputs without having to open up your browser's devtools..
  - id: dock
    name: dock
    label: The console dragged by its header over the editor and dropped under it, leaving the preview full height.
    caption: Arrange the layout of the panels however you feel more comfortable working. Make this space your own.
  - id: broadcast
    name: broadcast
    label: The instructor's window broadcasting. They edit the title and a value, select a function, then scroll to the styles.
    caption: As an instructor, you can broadcast your changes in a room, and any student connected to it will follow code changes, selections, and scroll.
  - id: follow
    name: follow
    label: A student's window in the light theme, following the instructor. The same edits, selections and scrolling arrive live.
    caption: As a student, you can follow your instructor's changes, selection, and scroll while connected to the room. You can pause the connection and play around with the code locally, and when you rejoin you will get the latest updates from the broadcast.Do it while on light or dark mode. Your choice.
  - id: history
    name: snapshots
    label: The snapshot drawer opened, a snapshot compared side by side with the current code, then restored.
    caption: A very simple version control system will help you keep track of your experiments. Use them to compare with previous changes or to restore to a state where you want the code to be.
  - id: changelog
    name: changelog
    label: The version in the footer clicked, opening a sheet with what changed in each release.
    caption: Learn what the latest changes and fixes are via the changelog.
---
::


Here's a video explanation of the live features and a little bit of a walkthrough. (Mind you that the UI might not look exactly the same, but the live features do behave the same):

::media-video{src="https://youtu.be/I73zTR3OIqQ" title="yehyecoa-vue Live features for #vuejs #playground" poster="/media/yehyecoa-vue/live-features.jpg"}
A quick walkthrough of the live features for instructors' broadcast, and students following along the lesson explanation.
::


::media-stills{dir="/media/yehyecoa-vue/stills" width="1920" height="1080" label="Yehyecoa's screens"}
---
items:
  - src: focus-hero
    alt: The playground in dark mode, the file list, the editor with App.vue and the rendered preview side by side.
    caption: "Just your component and what it renders. No version picker, no compiled output."
  - src: console-dock-docked
    alt: The console docked under the editor, with the preview taking the full height.
    caption: "Dock the console under the editor and the preview gets the whole height."
  - src: together-instructor-broadcast
    alt: The instructor's window while broadcasting, with a block of styles selected.
    caption: "Broadcasting: whatever the instructor types, selects or scrolls goes out to the room."
  - src: together-student-light-sync
    alt: A student's window in the light theme, marked as following the instructor.
    caption: "A student following along live, in the theme they picked."
  - src: safety-diff-view
    alt: A side-by-side diff between the current code and a saved snapshot, over the snapshot drawer.
    caption: "Compare a snapshot with your current code before you restore it."
  - src: changelog-sheet
    alt: The changelog sheet open over the playground, listing three beta releases.
    caption: "Click the version in the footer to see what changed in each release."
---
::
