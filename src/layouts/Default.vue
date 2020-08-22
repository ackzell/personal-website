<template>
  <div>
    <div class="flex flex-col justify-center h-full fixed">
      <SocialBar class="md:invisible" />
    </div>
    <div class="prose prose-sm lg:prose-lg xl:prose-xl px-4 mx-auto mt-3 pl-12">
      <h1 class="text-center prose-sm mb-0">Axel Martínez (ackzell)</h1>
      <header>
        <nav
          class="flex justify-between sm:justify-around items-center h-16 mb-4 mx-2 sm:mx-0 text-center"
        >
          <g-link class="text-xs sm:text-base" to="/">About Me</g-link>
          <a class="text-xs sm:text-base" href="/#video-series">Video Series</a>
          <a class="text-xs sm:text-base" href="/#notes-on-vue">Notes On Vue</a>
          <a class="text-xs sm:text-base" href="/#podcast">Podcast</a>
        </nav>
      </header>
      <slot />
    </div>
    <SocialBar />
  </div>
</template>

<static-query>
query {
  metadata {
    siteName
  }
}
</static-query>

<script>
import SocialBar from '~/components/SocialBar.vue'
export default {
  components: {
    SocialBar,
  },
}
</script>

<style>
</style>
