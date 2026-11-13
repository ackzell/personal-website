// @unocss-include — icon classes below are read by UnoCSS from this file.
/** Main navigation. Labels come from `nav.<key>` in i18n/locales. */
export const mainNav = [
  {
    key: 'about',
    to: '/',
    section: 'about',
    children: [
      { key: 'contributions', to: '/contributions' },
      { key: 'uses', to: '/uses' },
    ],
  },
  { key: 'work', to: '/projects', section: 'work' },
  {
    key: 'media',
    to: '/content',
    section: 'media',
    // Labels come from `<key>.title`, the pages' own headings.
    children: [
      { key: 'videos', to: '/content/videos' },
      { key: 'podcast', to: '/content/podcast' },
    ],
  },
] as const

export const socialLinks = [
  { label: 'GitHub', icon: 'i-simple-icons-github', href: 'https://github.com/ackzell' },
  { label: 'YouTube', icon: 'i-simple-icons-youtube', href: 'https://youtube.com/@ackzell' },
  { label: 'Bluesky', icon: 'i-simple-icons-bluesky', href: 'https://bsky.app/profile/ackzell.dev' },
  { label: 'LinkedIn', icon: 'i-simple-icons-linkedin', href: 'https://www.linkedin.com/in/ackzell' },
  { label: 'dev.to', icon: 'i-simple-icons-devdotto', href: 'https://dev.to/ackzell' },
  { label: 'X', icon: 'i-simple-icons-x', href: 'https://x.com/_ackzell' },
] as const
