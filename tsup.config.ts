import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: false,
  },
  {
    // The CDN/`<script>` build — `globalName` is what makes this attach
    // itself as `window.KlappayOne`; the merchant embeds this file
    // (renamed `one@1.js` at the CDN, same bytes) directly, never `import`s
    // it. Not listed in package.json's `exports` for that reason, same as
    // klap-checkout-kit's own IIFE build.
    entry: { index: 'src/index.ts' },
    format: ['iife'],
    globalName: 'KlappayOne',
    minify: true,
    dts: false,
    clean: false,
  },
  {
    entry: { 'react/index': 'src/react/index.tsx' },
    format: ['esm'],
    dts: true,
    clean: false,
    external: ['react'],
  },
])
