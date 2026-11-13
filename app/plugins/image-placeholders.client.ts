/*
 * An image shows a placeholder (main.css, "Image placeholders") until it
 * loads or fails, so on a slow connection a page that arrives ahead of its
 * images doesn't read as empty. load and error don't bubble: caught on the
 * way down instead.
 */
export default defineNuxtPlugin(() => {
  const settle = (event: Event) => {
    if (event.target instanceof HTMLImageElement) event.target.dataset.loaded = ''
  }
  document.addEventListener('load', settle, { capture: true })
  document.addEventListener('error', settle, { capture: true })
  // Ones that finished before this ran fired their events unheard.
  for (const img of document.images) if (img.complete) img.dataset.loaded = ''
})
