---
title: "Nitlapohua"
description: "A couch-multiplayer mental math battle for the family."
meaning: "I count"
pronunciation: "nee-tla-POH-wah"
---

<!-- TODO(owner): this copy is a placeholder drafted by Claude from the repo's README, not yours. Rewrite it in your own words, in both languages. Add repos/links in content/projects/nitlapohua.yml once the repo or deploy is public. -->

::media-clip{src="/media/nitlapohua/video.mp4" webm="/media/nitlapohua/video.webm" label="Nitlapōhua intro" width="1920" height="1080"}
::


We could all use some math practice at home, so I built this to help my kids with their quick maths, the mental math kind. The goal is to make it feel like a game we can all play together at the same time, but that they can also play on their own.

There are two ways to play:

- **Battle mode:** we all play together at the same time and go head to head.
- **Individual mode:** they practice basic arithmetic on their own, at their own pace.

The idea is that it automatically calibrates to their level. As they get better at the current level, it starts asking them harder and harder questions, so it keeps growing with them.

::media-stills{dir="/media/nitlapohua/stills" width="1170" height="2532" label="Nitlapohua's screens"}
---
items:
  - src: question-john
    alt: John's phone at level 2, a single-digit subtraction over the chalkboard number pad.
    caption: "Everyone gets their own question. John is on level 2, so single-digit operations."
  - src: question-paul
    alt: "Paul's phone at a higher level, a division: 63 ÷ 7."
    caption: "In the same round, Paul is on level 8 and gets divisions."
  - src: question-george
    alt: "George's phone at an even higher level, a longer division: 295 ÷ 5."
    caption: "And George, on level 14, slightly longer divisions. Same game, everyone at their own level."
  - src: lobby
    alt: The lobby, with the QR code, the four-letter room code and the three players ready.
    caption: "Scan the QR code or type the four-letter code to join from your phone."
  - src: calibration
    alt: Ringo's first calibration, answering until he misses two.
    caption: "The first round finds your level: you keep answering until you miss two."
  - src: stamp
    alt: A correct answer stamped ¡BIEN!, with the points it earned underneath.
    caption: "Get it right and it gets stamped ¡BIEN!, with the points you earned."
  - src: streak
    alt: A fifth straight correct answer, showing the ×3 streak chip and the multiplied points.
    caption: "Keep a streak going and your points start multiplying."
  - src: interlude
    alt: Between bursts, with the standings, a recap of the last burst and the button for the next one.
    caption: "Between bursts, check the standings and how the last one went."
  - src: results
    alt: Final standings, with each player's score and how their level moved.
    caption: "At the end, everyone's score and how far their level moved."
---
::


## On building it
This is one of the first projects I started using skills for. More specifically the skills grill-me and handoff. And all I did was set the technology I wanted to use and bounce some ideas with the LLM model. After that I asked for specific changes and things that I wanted to do and you can actually watch a video regarding all of this here:

::media-video{src="https://youtu.be/Jryar4K7ltQ" title="Nitlapōhua: A multiplayer maths game I made for my kids" poster="/media/nitlapohua/essay.jpg"}
::