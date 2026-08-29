# Examples

Runnable integrations, one per app shape — not snippets to read, apps to
clone and `pnpm install && pnpm dev`. For inline code walkthroughs (read
without cloning anything), see [`docs/examples.md`](../docs/examples.md)
instead.

| Example | Demonstrates |
| --- | --- |
| [`vanilla/`](./vanilla) | No bundler at all — the prebuilt `<script>` build, zero frontend build step (mirrors klap-checkout's own setup) |
| [`nextjs/`](./nextjs) | Next.js App Router — a Route Handler creating the charge + `<KlappayButton />` in a Client Component |
| [`sveltekit/`](./sveltekit) | SvelteKit — a `+server.ts` route + the raw `<klappay-button>` element in a Svelte template |
| [`nuxt/`](./nuxt) | Nuxt — a Nitro server route + a Vue component wrapping `<klappay-button>` |

Each app is fully standalone — none of them are part of a pnpm workspace
with the root package, and each has its own `package.json` and
lockfile-free `pnpm install`.

## Bring your own `KLAP_API_KEY`/`KLAP_BASE_URL`

Every example calls `createClient({ apiKey, baseUrl })`
(`@klappay/node`) on its own backend to create the `Charge` that
`@klappay/one` then renders a button for — the same public,
API-key-authenticated `/v1` surface any external merchant integration
uses. That means each example only ever creates charges under the
`KLAP_API_KEY` you provide — set it (and `KLAP_BASE_URL`) before running,
per each example's own README, or charge creation fails.

Every example also needs `KLAP_ONE_ORIGIN` (or its framework's public-env
equivalent, e.g. `NEXT_PUBLIC_KLAP_ONE_ORIGIN`) — the Klappay origin
`@klappay/one` opens. See each example's README for the exact variable
name it reads.

## `@klappay/one` is always the local build

Every example depends on `"@klappay/one": "file:../.."` — always this
repo's own `dist/`, never a version from npm — committed that way on
purpose, so a fresh clone always exercises whatever is on this branch, not
whatever happens to be published. No `pnpm-lock.yaml` is committed under
`examples/*` (each example's dependency tree is otherwise free to drift
with npm's registry).

Run `pnpm build` at the repo root before running an example the first
time, and again after changing the library — since it's a real filesystem
link, each example (already `pnpm install`ed) picks up the new `dist/`
immediately, no re-install, link, or unlink step needed.

## Tests

Each example ships a small `test`/`typecheck` script exercising its own
server-side logic (the charge-creation route, mainly) with real
assertions against a fake `@klappay/node` client — not the button/bridge
itself, which is already covered by this repo's own
`src/core/*.test.ts` (see the root `CLAUDE.md`'s test discipline section).
An example's test proves its *own* wiring is correct, not that
`@klappay/one` works — that would be redundant with the tests that
already live next to the code they cover.

## CI

`.github/workflows/ci.yml` runs two jobs against these examples:

- **`examples`** builds `@klappay/one` from source, then installs,
  typechecks, tests, and builds each app against it — always the local
  build, on every push. This is the real gate: it fails the build if a
  change to the library breaks any example.
- **`examples-published-smoke-test`** overrides the dependency to `latest`
  instead and repeats the same checks, but doesn't block the build
  (`continue-on-error: true`). It's expected to fail for a stretch after
  merging a feature and before merging its "Version Packages" PR — that's
  npm not having the change yet, not a bug in the example. When it passes,
  that's confirmation of what a fresh `pnpm install` actually gets today.
