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

## `@klappay/one` is always `"latest"`

Every example depends on `"@klappay/one": "latest"` — the npm dist-tag,
not a pinned version — on purpose. No `pnpm-lock.yaml` is committed under
`examples/*` either. That means every `pnpm install` here re-resolves to
whatever is actually published on npm right now, so these examples double
as a live integration check of real releases, not a snapshot that quietly
drifts from what a fresh install actually gets.

**Testing local, unpublished changes before you push:** build the package
first (`pnpm build` at the repo root), then from inside an example run
`pnpm link ../../` to point `@klappay/one` at that local build instead of
the npm-published version. Run `pnpm unlink @klappay/one && pnpm install`
afterward to restore the real published version — every example's
`package.json` should always read `"latest"` when committed, never a
`link:`/`file:` dependency.

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

`.github/workflows/ci.yml`'s `examples` job installs, typechecks, tests,
and builds each app on every push — no deploy, just a correctness check
(and, since nothing is pinned, an early warning if a real release breaks
one of these).

It tries the published `latest` first. That's the real signal described
above — when it passes, the example genuinely works against what's
installable today. When a change has landed on `main` but its "Version
Packages" PR hasn't been merged yet (the normal state in between),
`latest` doesn't have what the example needs yet, which would otherwise
fail CI for a reason that has nothing to do with the example's own code.
CI logs a `::notice::` and falls back to building `@klappay/one` from
source and `pnpm link`-ing it in — the same manual steps described above
— before trying again. If it still fails after that, it's a real bug in
the example.
