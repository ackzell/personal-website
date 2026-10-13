/**
 * Publishes an element's border-box height on <html> as a CSS custom
 * property, kept current with a ResizeObserver. The sticky header and footer
 * use it so scroll-padding (main.css) keeps anchored and focused content clear
 * of them.
 */
export function usePublishedHeight(target: Readonly<Ref<HTMLElement | null>>, property: string) {
  let observer: ResizeObserver | undefined

  onMounted(() => {
    observer = new ResizeObserver(([entry]) => {
      const height = entry?.borderBoxSize[0]?.blockSize ?? 0
      document.documentElement.style.setProperty(property, `${height}px`)
    })
    if (target.value) observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())
}
