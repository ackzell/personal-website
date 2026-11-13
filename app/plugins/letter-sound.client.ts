/*
 * Words that write themselves under the pointer (project names, parts, the
 * index, the media timeline, experience's companies: one span per letter,
 * each leaning in on its own delay through --slnt, main.css) are heard as
 * they're seen, from one place: each letter thumps as its lean starts. Only
 * on the way in: a letter still near upright when it starts is leaning in;
 * one near -15 is going back. Every word at one level, whatever its size.
 */
const LEANED = -15

export default defineNuxtPlugin(() => {
  document.addEventListener('transitionstart', (event) => {
    if (event.propertyName !== '--slnt') return
    const char = event.target as HTMLElement
    const style = getComputedStyle(char)
    if (Number(style.getPropertyValue('--slnt')) < LEANED / 2) return
    const word = char.parentElement?.children
    if (!word) return
    const along = word.length > 1 ? Array.prototype.indexOf.call(word, char) / (word.length - 1) : 0
    soundLetter(along)
  })
})
