import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  title: '@klappay/one',
  description:
    "Klappay One's embeddable payment button — a modal (iframe) or popup pointing at Klappay's hosted identity/wallet flow, relaying the result back via postMessage.",
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'force-dark',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]],

  vite: {
    plugins: [llmstxt({ domain: 'https://js-one.klappay.com' })],
  },

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Examples', link: '/examples' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@klappay/one' },
    ],

    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'The button', link: '/button' },
          { text: 'Programmatic API', link: '/programmatic' },
          { text: 'React', link: '/react' },
          { text: 'Other frameworks', link: '/frameworks' },
          { text: 'iframe vs. popup', link: '/modes' },
          { text: 'Styling', link: '/styling' },
          { text: 'Errors', link: '/errors' },
          { text: 'Protocol & security', link: '/protocol' },
          { text: 'Examples', link: '/examples' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/klappay/klap-one-js' }],

    footer: {
      message: 'Docs live in ./docs — the source of truth for both the package and this site.',
      copyright: 'MIT — Klappay',
    },
  },
})
