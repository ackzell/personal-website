/**
 * True while a language switch is turning the page over
 * (plugins/locale-scramble.client.ts): from the moment it starts until the
 * page in the new language is in. A component that paints its own copy of
 * its text (HomeIntro) holds the old copy until then, so it can fade out in
 * the old language with the rest of the page.
 */
export const localeSwitching = ref(false)

// A switch is the same page under another locale's name (about___es).
const localeOf = (name: unknown) => String(name ?? '').split('___')[1]
const baseOf = (name: unknown) => String(name ?? '').split('___')[0]

/** Whether going from one route to the other only changes the language. */
export const isLocaleSwitch = (to: { name?: unknown }, from: { name?: unknown }) =>
  !!from.name && localeOf(to.name) !== localeOf(from.name) && baseOf(to.name) === baseOf(from.name)
