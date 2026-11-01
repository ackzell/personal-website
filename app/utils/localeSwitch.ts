/**
 * True while a language switch is turning the page over
 * (plugins/locale-scramble.client.ts): from the moment it starts until the
 * page in the new language is in. A component that paints its own copy of
 * its text (HomeIntro) holds the old copy until then, so it can fade out in
 * the old language with the rest of the page.
 */
export const localeSwitching = ref(false)
