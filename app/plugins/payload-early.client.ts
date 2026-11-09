/*
 * Starts the next page's data (its _payload.json) as the navigation begins,
 * alongside its code, instead of after the code is in (Nuxt's own load waits
 * for beforeResolve, and joins this fetch when it gets there). On a slow
 * connection the two used to queue one after the other.
 */
export default defineNuxtPlugin(() => {
  useRouter().beforeEach((to, from) => {
    if (to.path !== from.path) loadPayload(to.path).catch(() => {})
  })
})
