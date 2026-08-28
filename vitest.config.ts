import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // examples/* are standalone apps with their own test scripts (see
    // examples/README.md) — without this, vitest's default include glob
    // picks up their *.test.ts files too, pulling their own tsconfig/
    // build tooling into this package's test run.
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
})
