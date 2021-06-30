<template>
  <!-- <Layout :class="{ dark: darkModeEnabled }"> -->
  <Layout>
    <Logo />
    <!-- <Logo @click.native="toggleDarkMode" /> -->

    <div class="pl-2" v-scroll-spy="{ offset: 50 }">
      <AboutMe />
      <VideoSeries />
      <NotesOnVue />
      <Podcast />

      <p>
        Thanks for checking out this website! You can get a hold of me via email
        too, if you wanna do that: axel [dot] uriel [dot] mc [at] gmail [dot]
        com.
      </p>

      <p>
        The links on the left is where you can reach me on social media if you
        prefer.
      </p>
    </div>
  </Layout>
</template>

<script>
import Logo from '~/components/Logo.vue'
import AboutMe from '~/components/AboutMe.vue'
import VideoSeries from '~/components/VideoSeries.vue'
import NotesOnVue from '~/components/NotesOnVue.vue'
import Podcast from '~/components/Podcast.vue'

export default {
  components: {
    AboutMe,
    Logo,
    VideoSeries,
    NotesOnVue,
    Podcast,
  },
  // data() {
  //   return {
  //     darkModeEnabled: false,
  //   }
  // },
  // mounted() {
  //   const isDarkModePreferred =
  //     window.matchMedia &&
  //     window.matchMedia('(prefers-color-scheme: dark)').matches

  //   console.log({ isDarkModePreferred })

  //   this.darkModeEnabled =
  //     localStorage.getItem('prefersDarkMode') || isDarkModePreferred
  // },
  // methods: {
  //   toggleDarkMode() {
  //     this.darkModeEnabled = !this.darkModeEnabled
  //     localStorage.setItem('prefersDarkMode', this.darkModeEnabled)
  //   },
  // },
}
</script>

<style>
</style>
