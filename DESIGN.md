---
name: ackzell.dev
description: A personal portfolio set as a flag you cross, in monospace, where the stage color is the section you are in.
colors:
  soft-flag-green: "#00573c"
  soft-flag-paper: "#f6f2ea"
  soft-flag-red: "#a51e2c"
  soft-flag-ink: "#141312"
  deeper-green: "#0a2a20"
  deeper-red: "#3f1216"
  deeper-night: "#0c0b0a"
  deeper-paper: "#e4dcca"
  deeper-glow-green: "#4a9273"
  deeper-glow-red: "#b84c4c"
typography:
  heading:
    fontFamily: "Recursive, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 520
    lineHeight: 1.15
    fontVariation: "'CASL' 0.65"
  headword:
    fontFamily: "Recursive, ui-monospace, monospace"
    fontSize: "clamp(2rem, 4.5vw, 3rem)"
    fontWeight: 520
    lineHeight: 1
    fontVariation: "'CASL' 0.65"
  body:
    fontFamily: "Commit Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  code:
    fontFamily: "Recursive, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 320
    lineHeight: 1.65
    fontVariation: "'CASL' 0"
  nav-section:
    fontFamily: "Commit Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
  nav-child:
    fontFamily: "Commit Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: "0"
spacing:
  tight: "0.5rem"
  group: "1rem"
  block: "2rem"
  section: "clamp(3rem, 8vw, 6rem)"
  gutter: "clamp(1rem, 4vw, 2rem)"
components:
  flag-field:
    height: "0.25rem"
    backgroundColor: "{colors.soft-flag-green}"
    rounded: "{rounded.none}"
  nav-link-section:
    typography: "{typography.nav-section}"
    textColor: "{colors.soft-flag-paper}"
  nav-link-child:
    typography: "{typography.nav-child}"
    textColor: "{colors.soft-flag-paper}"
  site-chrome:
    backgroundColor: "{colors.soft-flag-green}"
    textColor: "{colors.soft-flag-paper}"
    padding: "1.25rem 2rem"
  social-link:
    size: "1.875rem"
    textColor: "{colors.soft-flag-paper}"
    rounded: "{rounded.none}"
---

# Design System: ackzell.dev

## Overview

**Creative North Star: "The Flag Atlas"**

The site is a map you cross, not a stack of pages. Its three sections follow the colors of a flag, left to right: about (green), work (white), media (red). The whole stage takes the color of the section you are in, and a thin band of flag fields in the sticky header shows where you stand and where you can go. Moving between sections is a wipe along the flag, cut into tiles: they open from where you pressed and run ahead in the direction of travel, and the old page clears just ahead of them. Where tiles can't run, it is a plain wipe in the direction of travel.

The voice is casual, rigorous and quiet, "engineer, not tinkerer". The casual lives in the type: monospace throughout, with a variable axis that softens letterforms toward handwriting. The rigor lives in the structure: one grid, one spacing scale, one semantic color set that resolves per section. Motion only appears when it carries meaning: a marker that travels, a word that moves between lexicon and heading, a headword that leans into cursive on hover.

There are no borders, shadows or cards. Color fields, opacity and type weight do all the separating. Nahuatl lives in project naming only, never as a visual motif.

**Key Characteristics:**
- Stage color is the navigation state: in vivid, green, graphite or red fills the page; in light, paper leans a few percent toward the section and its color carries the headings; in dark, the page is near-black tinted toward it.
- Monospace everywhere, two families, three roles.
- Flat and borderless. Depth is never simulated at rest; the one exception is the section change, whose tiles fly in from depth and land flat.
- One marker (the accent bar in the flag band) is the only chrome element that moves within a section.
- Every motion has a reduced-motion answer; content degrades to plain readable routes.

## Colors

A three-field flag palette in three schemes, picked on the footer switch (`color-scheme="vivid"`, `"light"`, `"dark"`; a first visit follows the system's light or dark, vivid is only ever picked). Vivid takes the colors straight ("Soft flag"); light sets ink on paper and lets the flag carry headings and accents; dark pulls each section toward black and lets a glow color carry accents ("Deeper").

### Primary
- **Flag Green** (#00573c): About stage in vivid, with paper text; About's headings, accent and paper tint in light.
- **Flag Red** (#a51e2c): Media stage in vivid; Media's headings, accent and paper tint in light.

### Secondary
- **Soft Paper** (#f6f2ea): The light stage (tinted 3% toward green or red on About and Media, held at its own lightness), and the text on vivid's green and red.
- **Graphite** (#404040) and **Silver** (#cecdcd): Vivid's work stage and its text: the flag's white halfway to night, as dark as the green and red. A dark stage for code and marks.

### Neutral
- **Ink** (#141312): Text on the paper stage.
- **Night** (#0c0b0a): Base of every dark stage and the neutral work stage in dark.
- **Deeper Green** (#0a2a20) and **Deeper Red** (#3f1216): Dark about and media fills, mixed 35% into night so they read as tinted blacks.
- **Deeper Paper** (#e4dcca): Text in dark scheme and the work section's accent.
- **Glow Green** (#4a9273) and **Glow Red** (#b84c4c): Dark-scheme accents and the flag band fields for about and media, since the deeper fills would all read near-black.

### Named Rules
**The Stage Rule.** The page background is the section. Never introduce a second background color for cards, panels or code blocks; surfaces are the stage itself. The one exception: in vivid, code under a gem picker sits on that gem's own editor background (`--code-bg`), since the full-color stage is too loud to read code on.

**The Semantic Only Rule.** Components use `--bg`, `--fg`, `--accent`, `--muted`, `--line`, never the raw palette. The raw names exist to define the semantic layer and nothing else.

**The Accent Is Foreground Rule.** In vivid the accent is the text color; the marker is paper-on-green, silver-on-graphite, paper-on-red. In light the accent is the section's flag (ink on work), and headings take it (`--heading`). In dark it becomes a hue (the glow).

## Typography

**Display / Heading Font:** Recursive (self-hosted, pinned to MONO 1, with ui-monospace fallback)
**Body Font:** Commit Mono (with ui-monospace fallback)
**Code Font:** Recursive, casual axis off

**Character:** Two monospaces with one personality dial. Recursive's CASL axis moves headings from tidy toward handwritten (0.65 at rest); Commit Mono keeps body text plain and even. Mono widths hold across every axis, so nothing reflows when letters animate.

### Hierarchy
- **Headword** (520, clamp(2rem, 4.5vw, 3rem), 1.0): Project Nahuatl words, in the lexicon and as project headings. Same size in both places so the word can travel between them as a pure move.
- **Heading** (520, CASL 0.65, 1.15): h1–h4, balanced wrapping.
- **Body** (400, 1rem, 1.65): Prose, at most 64ch.
- **Running head** (400, 0.875rem, uppercase, 0.08em tracking, muted): The quiet label over a section whose content speaks for itself (Projects, Experience, Content). Use the `running-head` shortcut.
- **Section label** (400, 1rem, 1.4): About, Work, Media in the flag band, full brightness.
- **Child label** (400, 0.75rem, 1.4): Projects, videos, podcast in the band, dimmed until current or hovered.
- **Code** (320, CASL 0, 1.65): Snippets and inline code.

### Named Rules
**The Brightness Hierarchy Rule.** Rank in navigation is carried by size and brightness, not hue. Section labels are full and larger; children are smaller and muted until current.

**The Lean Rule.** A headword leans -15° into cursive on hover or focus, letter by letter, only on devices that really hover. Weight never changes; a heavier word reads as bulging, not written.

## Layout

One grid with five named tracks: full, wide, content, wide, full. Page children sit in the 64ch content track by default and opt out to wide (72rem) or full with utilities. Header and footer are not grid children; they pad to the wide track so their contents line up.

Spacing is a 4px-based scale of steps with four semantic roles: tight (0.5rem, label to value), group (1rem, items in one group), block (2rem, between blocks) and section (3–6rem fluid, between sections). Space above a heading is larger than below it. The gutter is fluid, 1–2rem.

Below 40rem, the layout simplifies: the header's brand row scrolls away and only the flag band sticks; the footer becomes a 2.5rem icon rail on the inline-end edge, and main keeps a gutter at least as wide as the rail. The band starts collapsed to the three fields and your position, and a menu toggle opens the full map. Without JS, the full map is simply shown.

## Elevation & Depth

Flat, with no drop shadows. Depth is conveyed by tonal separation and motion: the sticky header and footer carry their own copy of the stage color so content scrolls under them rather than through them, and spotlighted lexicon entries step the others back to 40% opacity.

The one exception is light, not depth: what's lit glows like a neon tube. A core hotter than the accent (`--hot`, the accent mixed 45% toward white), then zero-offset halos of growing radius and falling strength (`--glow`, five layers out to 56px; `--glow-near`, the first three, for bars inside a clipping box), added onto the stage with `plus-lighter`. It comes on steady, never with a strike flicker. Tokens live in `main.css`.

### Named Rules
**The Lit Rule.** Glow marks what's lit, and nothing else: the experience role being read, the page you're on in the flag band. Hover and focus preview without light (a field brightens, a marker fills faintly); chrome such as the footer icons never glows. Light only adds onto a darker stage (dark, and all of vivid), so on light's paper what's lit is the plain accent with a faint bleed instead (`--glow-blend: normal`).

**The No Border Rule.** No borders, rules or outlines as decoration. The stage shows through the gaps between fields. The only outline is the 2px accent focus ring.

## Shapes

Square and unadorned. Fields are straight horizontal bars (0.25rem tall when open, half that when closed, so a paper field never reads as the paper marker). Corners are never rounded. The recurring silhouette is a bar: the flag fields, the marker, the track the marker rides on.

## Components

### Flag Band (navigation)
- **Character:** A row of colored fields, in flag order, with a label under each. Closed sections show their flag color; the open section is the stage itself with a faint track for the marker to ride on.
- **Marker:** One accent bar marks the current page. It slides between pages on navigation, in the direction of travel, arriving in its new section's accent. It's lit per The Lit Rule, with `--glow-near` since the open section's stops scroll sideways and would clip wider halos.
- **Intro:** On a full load (not in-app navigation) the light runs along the band once, field by field, left to right, under a second end to end, and leaves the marker lit. Reduced motion skips it.
- **Hover / Focus:** A faint marker (35% accent) fills the field from the left, as the real one would arrive. Pressing firms it up to 60%. Not shown on the current page.
- **Submenu labels:** At rest an open section shows children as fields plus the current label. As the pointer nears, labels ripple in from the stop nearest it, 60ms per step; picking a child hides the rest until the pointer leaves and returns. Touch keeps them shown.
- **Mobile:** Collapsed fields with a Menu toggle covering the whole band; open, segments stack and project words wrap, with 2.75rem targets.

### Header and Footer
- **Header:** Sticky, stage-colored. Brand name in code type, locale switch at the end, the band on its own row spanning the wide track. On mobile only the band sticks.
- **Footer:** Icon-only social links, 30px targets edge to edge with 12px between icons; the label lives in aria-label and title. On mobile it is a fixed icon rail.

### Backdrop Mark
- **Character:** The ax mark behind every stage, scaled far past the screen with its ring bleeding off the inline-end edge. It lives in the layout, so it stays put across pages and only its shade follows the section. The header, footer and other bars that paint the stage color carry clipped copies, so it reads as one shape under all of them. It fades in once mounted; without JS there is no mark.
- **Shade:** A faint step off the stage, at 14% opacity. Light mixes 12% of the accent into the stage, vivid 10% of white, dark 40% of black. Dark's work mixes the stage with 20% of its accent instead, a light mark on the night stage.
- **Ripple:** A tap or click on the mark's own shape sends a ring of tiles through it, and through nothing else on the page. It uses the section transition's 32px bricks; each tile lags the front a little, so the ring never reads as a clean circle, and it weakens as it travels. Tiles take the accent at up to 9% in light, 16% in vivid and dark, so light and dark tint them per section while vivid's and work's stay neutral.
- **Press:** Presses on the mark's gaps, on links and other controls, drags, scrolls and clicks that end a text selection send nothing. Nothing runs until the first press or after the ring has passed, a section change clears it, and under reduced motion it never fires; the mark stays still.

### Lexicon
- **Character:** A dictionary running head with entries in columns. Each entry is one target: the headword link covers it.
- **Spotlight:** Hovering or focusing one entry dims the rest to 40%.
- **Hover:** Letters lean into cursive per The Lean Rule.

### Experience Band
- **Character:** The flag band standing up: one field per role, newest on top, each as tall as the time spent there, sticky beside the roles. Awards and certifications mark their month with a small square.
- **Lit:** The role being read lights its field per The Lit Rule; the other roles step back. Pointing at a role brightens its field without the light.
- **Arrival:** Fields draw in top to bottom the first time the band scrolls into view; under reduced motion they fade in.

### Media Guide
- **Character:** Data, not a feed: each series (a playlist, or a podcast season) is one strip of square cells, a cell per release, oldest first, so a series reads as how much there is. A strip is as long as its release count against the longest on the page; time is not a shared axis, since the old playlists would shrink to slivers. The row's text carries the count, years and, for the podcast, hours and downloads.
- **Cells:** A video is a 16:9 frame; an episode is a bar as tall as it runs, shaded by its downloads, by rank among the episodes (22% for the fewest to full for the most; a linear scale bunches, since one episode far outdraws the rest). Height stays length. Videos sit at 78%; full on hover or focus. Each cell links to its release.
- **Readout:** Pointing at or focusing a cell names it in the line under the strip (date, title, length); at rest the line gives the series' first and last dates. A video's cell also brings up its own YouTube still at 16:9 in a tooltip that trails the pointer (SiteTooltip), fetched only then; episodes have no still. Touch follows the link.
- **Legend:** A small key pinned top right beneath the header while the guide is on screen (about a quarter of the width on phones), stage-colored, muted, no border: for the podcast a short and a tall bar ("taller is longer") and a light-to-full ramp ("darker is more downloaded"), then "each bar is an episode, oldest first"; for videos, "each frame is a video, oldest first; a longer row has more videos".
- **Rows:** Stage color only, no rules between them. The name opens the latest releases and the way out to YouTube or mytypeof.dev.
- **Mobile:** The name, stats and note stack above the strip.

### Media Timeline
- **Character:** The media hub is one timeline: every release on a shared calendar, a column per month (a quarter on phones), videos stacked up from the axis and episodes hanging below it. A column is the time published that month, against the busiest month on either side; both halves share one scale. A month of videos is one bar (short videos made blocks thinner than their gaps, which shimmered on scroll); episodes stack a block each, as tall as it runs. Without lengths in a feed, a release counts as one. Videos sit at 78%, episodes full, as on their guides.
- **Doors:** Each half is a door: its headword (Videos, Podcast) at the project headword size, one line on what it is, and its totals, on the left of its half. The link covers the name and the bars, and the word travels into the section's heading as a project's word does.
- **Readout:** Pointing along the timeline, or scrubbing it with a finger, reads the column out in the line over it (month, then each side's count and hours) and steps the other columns back to 40%. At rest the line gives the first and last months. A visually hidden table by year carries the same for screen readers.
- **Hover / Focus:** The pointed-at half's word leans as in the lexicon and its arrow steps forward.
- **Arrival:** Columns grow out of the axis, oldest first, left to right. Reduced motion fades them in.
- **Mobile:** One column: the readout, Videos and its bars, the axis (every other year marked), the podcast's bars, then its name.

### Uses Tables
- **Character:** What I use, as a psql session answers it: per category (following what uses.tech suggests a uses page covers), a query on two lines (`ackzell=> SELECT * FROM uses`, then `WHERE category = 'Editor';` under SELECT), highlighted as an editor would: prompt muted, keywords foreground, the names (`*`, `uses`, `category`) the accent 70% into the stage, a shade apart in either scheme (light has no accent of its own, so there it is the only highlight), the string literal accent, the SQL itself untranslated), the result as a table drawn in type, box-drawing glyphs in muted code (┌─┬─┐ │ ├─┼─┤ └─┴─┘), no CSS borders, and the count under it as psql prints it, "(2 rows)". Columns: Tool (foreground; a link to the product, with a muted ↗, when it has one), Years (from the first to the last, or to "now" while still in use, accent, tabular), Note (muted, wrapping, its bars repeating line by line). Every table shares its column widths, so the frames line up down the page. The years carry the experience.
- **Structure:** A grid with table roles; the frame is aria-hidden glyphs. The typed query is hidden from assistive tech, and the category name alone labels the table. The header rows (top rule, labels, separator) stick under the site header on the stage color while their table scrolls.
- **Motion:** When a query comes into view (on arrival for those on screen, the rest as scrolled to), it is typed a character at a time under a block cursor, which then blinks at the end of the line a few times while its table draws row by row as a terminal prints: rules left to right, bars downward, then the words come into focus from a slight blur; then the count. The tables skip the page rise. Without script, or with reduced motion, they are simply there.
- **Layout:** On the wide track; from 64rem the tables sit two side by side.
- **Mobile:** Two columns, Tool and Years; the note drops under its tool inside the same frame, and its header is read, not shown.

### 404 Solitaire
- **Character:** The 404 page is a game of solitaire. The deck is HTTP status codes: 2xx, 3xx and 4xx are the suits, the last digit the rank, with the reason phrase on the card as the protocol words it. The suit digit is heavier (700 against 400), so the suits read without their colors. It's dealt from the bad URL, only from deals a casual player wins nine times in ten or more (tests/solitaire.test.ts). Only real 404s get it; other errors keep the plain page.
- **Cards and slots:** Every card, either face up, carries the site's mark cropped the way the stage crops it, at 7% of its ink. Empty slots stay plain: a 3% fill and a label at the lowest contrast that still makes AA (--slot-ink).
- **The missing card:** 404 isn't dealt. It's the page's heading, and it goes on the 4xx pile between 403 and 405. Once 403 is down the heading comes on per The Lit Rule and keeps lifting to be taken; under reduced motion it only comes on.
- **Cards:** The one place cards exist, since here they're the material, not a container. Square and flat, no shadows: the stage shows through a 2px gap around each (`--card-*`, main.css). On light they're paper faces with the flag as the ink. On vivid the flag's fields are the faces, except the suit that matches the stage (2xx on green, 3xx on graphite, 4xx on red), which takes the stage's text color as its face so it doesn't sink in; every face-up card there also carries a 1.5px edge in that color, because the flag's faces are as dark as the stages and a hue difference alone goes missing for red-green color blindness. On dark, the lit colors with night ink.
- **Input:** Press sends a card to its pile, or else the next column it fits; drag places it. On the table Tab is one stop and the arrows walk the cards. Undo goes all the way back; start over deals the same game again, won or not.
- **Held:** A dragged card comes up off the table, tipped so the half it's held by is the nearer one, and settles flat as it lands. Under reduced motion it stays flat.
- **Won:** The three full piles light, each in its own suit's color (on vivid, the suit that matches the stage lights in the stage's text color), and each becomes the way into its section. The cards then leave the piles one by one and bounce off the bottom of the screen, stamping a trail that fades once the last is gone; doors stay live underneath. Reduced motion skips the bounce.

### Links
- **Style:** Accent colored, underlined by default; navigation links drop the underline and rely on the band.
- **Focus:** 2px accent outline, 2px offset.

## Do's and Don'ts

### Do:
- **Do** let the stage color follow the section, and fade it over 600ms (200ms under reduced motion) where view transitions don't run.
- **Do** use semantic color tokens and spacing roles (`gap-group`, `mt-section`) from the UnoCSS preset, not raw values.
- **Do** give every motion a reduced-motion answer: the color change still reads, the movement goes.
- **Do** keep icon-only controls labelled via aria-label and title, with touch targets at least 30px.
- **Do** answer every press at once and ease back over 250ms as it lifts, at one of three weights set with `data-press` (main.css): words dim, small controls (`key`) dim and give a little, pictures (`sink`) sink and darken; a link stretched over its row (`cover`) dims by opacity, never filter or scale, which would shrink its target. Something with its own press answer opts out with `data-press="none"`. A control reset with `all: unset` loses the press with it, so it puts its press back in its own styles.
- **Do** use `ease-out` (cubic-bezier(0.16, 1, 0.3, 1)) for entrances and `ease-in-out` (cubic-bezier(0.65, 0, 0.35, 1)) for things that move across the screen.

### Don't:
- **Don't** add borders, drop shadows, cards or rounded corners.
- **Don't** glow anything that isn't lit (The Lit Rule), and don't make the glow flicker.
- **Don't** introduce a hue outside the flag palette, or a color that doesn't resolve per section and scheme.
- **Don't** use `text="…"` attributify on `<a>` or `NuxtLink`; it overwrites the link label.
- **Don't** use Nahuatl as a visual motif, and don't invent words, pronunciations or meanings; they come from the owner.
- **Don't** animate the weight axis; only slant, casual and cursive move.
