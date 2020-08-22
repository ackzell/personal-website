<template>
  <div>
    <div class="absolute flex flex-col justify-center h-full md:pt-12">
      <SocialBar class="md:invisible" />
    </div>
    <div class="prose prose-xs lg:prose-lg xl:prose-xl mx-auto mt-3">
      <h1 class="text-center prose-sm mb-0">
        Axel Martínez
        <br />(ackzell)
      </h1>
      <header>
        <nav class="flex justify-between xs:justify-around items-center mb-4 mx-2 sm:mx-0 xs:ml-5">
          <g-link class="text-xs sm:text-base" to="/">About me</g-link>
          <a class="text-xs sm:text-base" href="/#video-series">Video series</a>
          <a class="text-xs sm:text-base" href="/#notes-on-vue">Notes on Vue</a>
          <a class="text-xs sm:text-base" href="/#podcast">Podcast</a>
        </nav>
      </header>
      <div class="pl-12 pr-3 md:px-0">
        <slot />
      </div>
    </div>
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
.prose a {
  word-spacing: -4px;
  transition: all 0.4s ease-in-out;
}
</style>
