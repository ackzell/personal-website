// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from '~/layouts/Default.vue'
import './css/main.css'

import 'vue-lazy-youtube-video/dist/style.css'
import LazyYoutubeVideo from 'vue-lazy-youtube-video'

if (process.isClient) {
  var ScrollSpy = require('vue2-scrollspy')
}

export default function(Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)
  Vue.component('LazyYoutubeVideo', LazyYoutubeVideo)
  if (process.isClient) {
    Vue.use(ScrollSpy)
  }

  head.link.push({
    rel: 'preload',
    as: 'font',
    href: 'https://fonts.googleapis.com/css2?family=Source+Code+Pro',
    type: 'font/woff2',
    crossorigin: 'anonymous',
  })
}
