<template>
  <section id="notes-on-vue">
    <h2>Notes on Vue</h2>

    <p>
      I am in the path of becoming an instructor of sorts. I like sharing my
      knowledge and learning new things, but I also like eating and providing to
      my family the best life I can give them. So the idea for
      <a
        href="https://notes-on-vue.netlify.app"
        target="_blank"
        rel="noopener noreferrer"
        >this website</a
      >
      is two folded:
    </p>

    <ul>
      <li>
        I want to organize my ideas and prepare some material I can use to be
        able to impart courses on Vue. At the same time other people can see
        what my level of understanding the technology is.
      </li>

      <li>
        I wanted to learn VuePress and see what it was all about. So that
        eventually I could also share my findings.
      </li>
    </ul>

    <p>
      This is a continuos Work In Progress and I plan on finishing it sooner
      rather than later. Maybe by the first couple months within 2021 I will be
      done with it. 🤞
    </p>

    <p>Here is a peek into what it looks like:</p>

    <video
      v-if="isDarkModePreferred"
      aria-label="A short video that showcases the Notes On Vue website experience."
      src="https://res.cloudinary.com/ackzell/video/upload/ac_none,q_60/v1626636944/ackzell.dev/notes-on-vue-dark.mp4"
      autoplay
      muted
      loop
    />

    <video
      v-else
      aria-label="A short video that showcases the Notes On Vue website experience."
      width="100%"
      src="https://res.cloudinary.com/ackzell/video/upload/v1626636941/ackzell.dev/notes-on-vue-light.mp4"
      autoplay
      muted
      loop
    />
  </section>
</template>

<script>
export default {
  name: 'NotesOnVue',
  data() {
    return {
      isDarkModePreferred: null,
    }
  },
  mounted() {
    this.isDarkModePreferred =
      window &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  },
}
</script>

<style></style>
