---
title: "playground"
description: "The in-browser environment for lessons and challenges, built on a fork of almostnode."
---

Before I tell you about the latest changes, I'll let you in on something I built before: it was based on [TutorialKit](https://tutorialkit.dev/) and it mostly worked, but I decided to move on to a truly Vue-ecosystem-based solution for the whole platform.

Even after I moved to Nuxt Content, and given the fact I forked [learn.nuxt.com](https://learn.nuxt.com/en), the first _interactive_ portion of the book was the playground, which initially was based on [web containers](https://webcontainers.io/) but then I came across [almostnode](https://almostnode.dev/) and decided to migrate to it.

::media-clip{src="/media/amoxtli/playground.mp4" webm="/media/amoxtli/playground.webm" poster="/media/amoxtli/playground.webp" label="Code edited in the Playground and saved as a snapshot, the snapshot compared side by side with the current code, then a prompt to save before leaving with unsaved changes." width="1440" height="900" wide}
::

## Some of the nitty, not all of the gritty
I had to fork almostnode and modify it to make it work, but one day it finally did. The main idea is to have a very similar environment that you would have in your own computer with Node running Vite and serving your development environment.

I'm not gonna lie, I used AI heavily for this. But given the results and the many audits that I've made to it, I think it is working as best as I could make it so I'm running with that. 

The way I understood web containers work is you need some kind of permission or license if you wanted to use their technology on for profit work, so I didn't want to get into that before being able to share it and charge for it. This is basically my main reason for moving to almostnode. 

And not less importantly, I did want to try AI and see how far I could take it for something that I would not otherwise feel comfortable doing on my own and that would definitely had taken much longer. So that's partly the reason why I migrated as well.

What the fork is mostly doing is serving Vue SFCs on real Vite 7, and it supports hot module replacement (HMR), an interactive shell, and the console without the host's page noise (the Nuxt app). It also has a web containers compatible API, to avoid re-wiring the Nuxt content App itself. 

This shares a couple features from [yehyecoa](/projects/yehyecoa): the version control system and the drag and drop to re-organize the layout.
