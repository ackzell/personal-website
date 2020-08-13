<template>
  <Layout>
    <Logo />

    <div class="pl-2">
      <p>I'm a software artisan (Engineer, developer, whatever you wanna call it; just never a ninja, rockstar or wizard... 😅) from Mexico who is currently and happily employed to work on the Front End side of things for web apps.</p>

      <p>I'm also always trying to build or create something to scratch an own itch, and that is also aimed at sharing with others what I've learned in the process.</p>

      <p>This is why I have a YouTube channel, a Vue.js notes website and the ocassional blog post.</p>

      <p>Feel free to reach out and thanks a lot for checking out the content in advance, I sure hope it will help you one way or another.</p>

      <p>Cheers!</p>
      <VideoSeries />
      <NotesOnVue />
    </div>
  </Layout>
</template>

<script>
import Logo from '~/components/Logo.vue'
import VideoSeries from '~/components/VideoSeries.vue'
import NotesOnVue from '~/components/NotesOnVue.vue'

export default {
  components: {
    Logo,
    VideoSeries,
    NotesOnVue,
  },
  metaInfo: {
    title: 'Hello, world!',
  },
}
</script>

<style>
</style>
