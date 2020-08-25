// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from '~/layouts/Default.vue'
import './css/main.css'
require('typeface-source-code-pro')

if (process.isClient) {
  var ScrollSpy = require('vue2-scrollspy')
}

export default function(Vue, { router, head, isClient }) {
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)
  if (process.isClient) {
    Vue.use(ScrollSpy)
  }
}
