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
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
  })

  head.link.push({
    rel: 'preload',
    as: 'font',
    href:
      'https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,900&display=swap',
    type: 'font/woff2',
    crossorigin: 'anonymous',
  })
}
