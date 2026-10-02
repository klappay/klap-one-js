import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  title: '@klappay/one',
  description:
    "Klap One's embeddable payment button — a modal (iframe) or popup pointing at Klap's hosted identity/wallet flow, relaying the result back via postMessage.",
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'force-dark',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: '48x48' }],
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    ['meta', { name: 'theme-color', content: '#09090B' }],
  ],

  vite: {
    plugins: [llmstxt({ domain: 'https://js-one.klappay.com' })],
    // Renders the demos from src/ rather than the built dist/, so
    // `pnpm docs:dev` picks up button changes without a rebuild.
    resolve: {
      alias: {
        '@klappay/one': fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
      },
    },
  },

  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag === 'klappay-button',
      },
    },
  },

  themeConfig: {
    logo: { src: '/brand/klap-one-symbol-small-on-dark.svg', alt: 'Klap One' },

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
          { text: 'Playground', link: '/playground' },
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
      copyright: 'MIT — Klap',
    },
  },
})
