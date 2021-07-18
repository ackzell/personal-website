<template>
  <section id="video-series" class>
    <h3>Video series</h3>

    <p>
      The idea behind the videos on
      <a
        href="https://www.youtube.com/c/ackzell/playlists"
        target="_blank"
        rel="noopener noreferrer"
        >YouTube</a
      >
      is to present a series each time I work on something. From desktop apps,
      to in-browser voice recording ones and documentation sites.
    </p>

    <p>
      Video content can be tricky to follow: scrubbing the video in search for
      what you want or need can be time consuming. So my main idea is to share
      with you via small videos how these apps are created piece by piece. This
      way you can hopefully find what you need in the shorter pieces.
    </p>

    <p>
      I try to go straight to the point and trust you will be able to figure out
      whatever you need for the extra information regarding the different
      topics.
    </p>

    <p>
      Check out the
      <a
        href="https://www.youtube.com/c/ackzell/playlists"
        target="_blank"
        rel="noopener noreferrer"
        >YouTube playlists</a
      >
      to see what I am talking about.
    </p>
    <p>
      This is the very first playlist I created, and it took me quite a while:
    </p>
    <LazyYoutubeVideo src="https://www.youtube.com/embed/dWGekDUJG1g" />
    <p>
      And this one is more recent, can you spot the difference in the audio
      quality?
    </p>
    <LazyYoutubeVideo src="https://www.youtube.com/embed/iU_kVbCt3aI" />
  </section>
</template>

<script>
export default {
  name: 'VideoSeries',
}
</script>

<style>
  @media (prefers-color-scheme: dark) {
    .prose a {
      color: #fafafa;
    }
  }

  @media (prefers-color-scheme: light) {
    .prose a {
      color: #212121;
    }
  }

  .prose img {
    margin: 0;
  }
</style>