import { useTravelingProject } from '~/utils/viewTransition'

/**
 * Keeps useTravelingProject (utils/viewTransition.ts) on the project at the
 * other end of each navigation. Set in beforeEach, so the leaving list renders
 * its name before the old snapshot and the arriving one renders with it.
 */
export default defineNuxtPlugin(() => {
  const traveling = useTravelingProject()
  const slugOf = (slug: unknown) => (typeof slug === 'string' ? slug : null)
  useRouter().beforeEach((to, from) => {
    traveling.value = slugOf(to.params.slug) ?? slugOf(from.params.slug)
  })
})
