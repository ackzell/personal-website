<template>
  <Layout>
    <Logo />

    <div class="pl-2" v-scroll-spy="{offset: 50}">
      <AboutMe />
      <VideoSeries />
      <NotesOnVue />
      <Podcast />
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
  metaInfo: {
    title: 'Welcome to my personal site!',
  },
}
</script>

<style>
</style>
