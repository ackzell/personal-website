---
title: "Tlachialoni"
description: "A minimal local browser for frontend development."
meaning: "instrument to see"
pronunciation: "tla-chia-LO-nee"
---

A frameless window that renders a local dev server edge to edge, with Chromium DevTools docked inside the same window.

::media-palette{dir="/media/tlachialoni" width="1440" height="900" label="Tlachialoni, a minimal browser for dev envs"}
---
items:
  - id: video
    name: video
    label: YouTube launch video
    video: https://youtu.be/3mEV4Aqni_s
    caption: This is the video I recorded for the "launch" of the project. Notably, there weren't any themed dev tools at that point.
  - id: tour
    name: tour
    label: All the features in one GIF.
    caption: All the features in one GIF.
  - id: palette
    name: palette
    label: The command palette.
    caption: The command palette. We control navigation, app settings, extensions and UI layout from here.
  - id: theme-picker
    name: theme-picker
    label: The browser supports 8 variations of Tlapalli, my own VSCode theme
    caption: "The browser supports 8 variations of Tlapalli, my own VSCode theme. Both in dark and light modes: Obsidian, Gold, Turquoise, Quartz, Lapis Lazuli, Amethyst, Jade and Fire Opal."
  - id: themed-devtools
    name: themed-devtools
    label: DevTools theme follows the overall browser's one.
    caption: DevTools theme follows the overall browser's one. I originally didn't have this, but realized I could implement it later, and I think it looks great.
  - id: history
    name: history
    label:  Swipe gestures for navigation are supported.
    caption: Use swipe gestures in your touchpad to navigate back and forth.
  - id: reload
    name: reload
    label: A reloading indicator
    caption: Also added after the release video, a reloading indicator lights the whole border of the window, and a little bit different one for the hard reloading was implemented too.
  - id: light-mode
    name: appereance
    label: Light mode is supported
    caption: You can pick light or dark modes as well as follow the operating system's mode.
  - id: strip
    name: title bar
    label: The title bar can be fixed or toggled on and off.
    caption: The title bar can be fixed or toggled on and off.
  - id: picker
    name: picker
    label: An Inspect Element picker is available.
    caption: An Inspect Element picker triggered even if DevTools is not open at the moment.
  
---
::

## The... what's it's name again?
This is a Tlachialoni (or Tlachieloni), it was a staff that used to be depicted being used by High Priests or deities who would **see through** a circle made of some kind of mirror (obsidian or metal):

::media-stills{dir="/media/tlachialoni/examples" width="1440" height="900" label="What is a tlachialoni"}
---
items:
  - src: codex-figures
    width: 522
    height: 381
    alt: "Line drawings of Tezcatlipoca and Huitzilopochtli from the Códice Tudela, Códice Magliabechiano and Códice Florentino, each holding a tlachialoni: a staff topped with a disc pierced by a hole."
  - src: seated-deity
    width: 721
    height: 878
    alt: A painted codex figure seated on a woven throne, holding up a tlachialoni with a red-ringed hole at the centre of its disc.
  - src: xiuhtecuhtli
    width: 300
    height: 437
    alt: Xiuhtecuhtli painted in a codex page, carrying a serpent-headed shield and a tlachialoni.
---
::

## But... why?

I really like the minimal experience that [Arc browser](https://arc.net/) has. But I just couldn't make it work as a dev browser for developing the front end of my apps. So after switching between a few other browsers including plain old Google Chrome and the [Orion browser](https://orionbrowser.com/), I decided to give it a shot and create my own version of what a minimalist dev focused browser could be.

I think this also looks great on a video where I am showing the app I am working on and the chrome around it is not distracting, so I can actually focus the attention on the contents of the app itself.

## Screenshots

Here are a few screenshots with a testing website, which we called "Test Card" like the ones for video production. The idea is you can see what the UI looks like when the browser is in use.

::media-stills{dir="/media/tlachialoni/stills" width="1440" height="900" label="Screenshots for Tlachialoni app"}
---
items:
  - src: page-loaded
    alt: "The Test Card page filling the frameless window edge to edge, with no browser chrome around it."
    caption: "Just the page. No tabs, no address bar, nothing between you and what you're building."
  - src: palette-all
    alt: "The command palette open over a dimmed window: recent localhost targets, then commands to toggle and dock DevTools, inspect, reload and go back, each with its shortcut."
    caption: "Everything starts from the command palette: jump to a local port, dock DevTools, inspect, reload."
  - src: picker-hover
    alt: "The Inspect Element picker highlighting the accent swatch card on the Test Card page, with DevTools closed."
    caption: "The Inspect Element picker works even while DevTools is closed."
  - src: devtools-bottom
    alt: "DevTools docked along the bottom of the window, themed to match the browser, under the Test Card page."
    caption: "DevTools docked at the bottom, wearing the same theme as the browser."
  - src: devtools-right
    alt: "DevTools docked on the right, with the Test Card page reflowed into the narrower column beside it."
    caption: "Or docked to the side, which doubles as a quick look at a narrower layout."
  - src: history-overlay-back
    alt: "A back arrow at the left edge of the page, shown while swiping on the touchpad to go back."
    caption: "Swipe on the touchpad and an arrow shows which way you're going."
  - src: failure
    alt: "The error card for an unreachable target: \"Can't reach this target\", http://localhost:3000, connection refused, with Retry, Edit URL and Go Back buttons."
    caption: "When the dev server isn't running yet, you get a quiet error with a retry instead of a blank window."
  - src: titlebar-mode
    alt: "The title bar pinned above the page, showing the address and window controls, with the window size in the corner."
    caption: "The title bar can stay put, with the window size in the corner."
  - src: strip-dark
    light: strip-light
    alt: "The thin title strip across the top of the window, holding the address and window controls."
    caption: "Or shrink to a thin strip you can toggle on and off."
---
::

## On how it is built

I really wanted to keep the Chromium DevTools because that's what I am used to. So I ended up creating an electron app and decided to also bring in [Spec Kit](https://speckit.org/) to manage the whole process of building the application.

I mostly used [OpenCode's](https://opencode.ai/) models for this with the paid subscription, and it's been quite an interesting experience so far.