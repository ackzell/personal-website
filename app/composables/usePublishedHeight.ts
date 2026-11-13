/**
 * Publishes an element's border-box height on <html> as a CSS custom
 * property, kept current as the element resizes. The sticky header and footer
 * use it so scroll-padding (main.css) keeps anchored and focused content clear
 * of them.
 */
export function usePublishedHeight(target: Readonly<Ref<HTMLElement | null>>, property: string) {
  useResizeObserver(target, ([entry]) => {
    const height = entry?.borderBoxSize[0]?.blockSize ?? 0
    document.documentElement.style.setProperty(property, `${height}px`)
  })
}
