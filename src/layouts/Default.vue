<template>
  <div>
    <div class="absolute flex flex-col justify-center h-full md:pt-12">
      <SocialBar />
    </div>
    <div class="prose prose-xs lg:prose-lg xl:prose-xl mx-auto mt-3">
      <h1 class="text-center prose-sm mb-0">
        Axel Martínez
        <br />(ackzell)
      </h1>
      <header>
        <fixed-header :threshold="110">
          <nav
            class="flex justify-between xs:justify-around items-center mb-4 mx-2 sm:mx-0 xs:ml-5"
            v-scroll-spy-active
            v-scroll-spy-link
          >
            <g-link class="text-xs sm:text-base" to="/#about-me" :exact="false">About me</g-link>
            <a class="text-xs sm:text-base" href="/#video-series">Video series</a>
            <a class="text-xs sm:text-base" href="/#notes-on-vue">Notes on Vue</a>
            <a class="text-xs sm:text-base" href="/#podcast">Podcast</a>
          </nav>
        </fixed-header>
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
import FixedHeader from 'vue-fixed-header'

import SocialBar from '~/components/SocialBar.vue'
export default {
  components: {
    SocialBar,
    FixedHeader,
  },
}
</script>

<style>
.prose a {
  word-spacing: -4px;
  transition: all 0.4s ease-in-out;
}

.prose a.active {
  color: #fafafa;
  text-shadow: #fafafa 1px 0 4px;
}

nav.vue-fixed-header--isFixed {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  padding: 0 20px;
  margin: 0;
  background: #0e0e0e;
  height: 3em;
  z-index: 1; /* lists are doing funky business and need to make this go on top*/
}
</style>
