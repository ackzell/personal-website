/** Main navigation. Labels come from `nav.<key>` in i18n/locales. */
export const mainNav = [
  { key: 'projects', to: '/projects' },
  { key: 'videos', to: '/videos' },
  { key: 'podcast', to: '/podcast' },
  { key: 'about', to: '/about' },
] as const

export const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/ackzell' },
  { label: 'YouTube', href: 'https://youtube.com/@ackzell' },
  { label: 'Bluesky', href: 'https://bsky.app/profile/ackzell.dev' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ackzell' },
  { label: 'dev.to', href: 'https://dev.to/ackzell' },
  { label: 'X', href: 'https://x.com/_ackzell' },
] as const
