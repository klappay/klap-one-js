# klap-one-js

Engineering conventions for whoever (human or agent) is editing this
code — not user-facing documentation (that's `README.md`). This is
`@klappay/one`, the embeddable payment button a merchant puts on their
own page — it opens an iframe/modal (default on every device — `mode`
overrides to `'popup'`) pointing at `klap-one`'s `/id/*` (hosted as
`one-id`) and relays the result back via `postMessage`. It has no server,
no database, and never runs OTP/wallet logic itself — see this repo's own
`docs/protocol.md` for why the split is drawn exactly there.
Conventions below are adapted from `../klap-node`'s `CLAUDE.md` (itself
trimmed from `../klap-core`), further trimmed/extended for a browser
SDK, and a new non-negotiable-invariants section since this runs in a
completely
different threat model than a package that only ever touches a trusted
backend's own secrets.

## Non-negotiable security invariants

These come straight from this repo's own `docs/protocol.md` — this package
never touches a private key or a session token, and any change that
seems to need one should stop and reconsider the design instead:

- **Never sees a private key.** The payer's own wallet app signs
  everything — that happens entirely inside `one-id` (a different
  origin, a different repo). This package never proposes or builds a
  transaction itself.
- **Never holds a session token.** The payer's session lives in
  `one-id`'s own cookie, on `klap-one`'s origin — this package never
  reads or stores anything from that popup beyond the public
  `PaymentResult` it relays via `postMessage`.
- **`core/bridge.ts` validates every message it receives** — `event.origin`
  against the configured `klap-one` origin, and `event.data.requestId`
  against the specific `open()` call in flight — before trusting anything
  in `event.data`. A message failing either check is silently dropped,
  never partially trusted.
- **The popup/iframe content is never white-labeled.** `variant`/`size`
  only ever style the *button* this package renders — `one-id`'s own
  content is 100% Klappay's, always, on every integration. Don't add a
  config option that changes what's inside the popup.
- **`onSuccess` is a UX signal, never proof of payment.** A merchant's
  real fulfillment must come from Klappay Core's own webhook
  (`charge.confirmed`), not this callback — see `docs/protocol.md`'s
  dedicated section. Don't design an API that makes the callback look
  like a safe place to release a product.
- **No `eval`/`Function` over anything from the network.** The button's
  markup/CSS is a static template compiled into the build, never HTML
  built from an API response.

## Commits

Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`,
`test:`, etc.), written in English regardless of what language the
conversation happened in. **Never add a `Co-Authored-By: Claude` (or
similar AI persona) trailer** — a commit is authored as the person
driving the session. Whenever asked to commit, run `git status`/`git
diff` first to see everything pending, not just whatever was most
recently touched, and split into separate commits along real seams
(a feature vs. an unrelated doc fix) rather than bundling.

## Test discipline

Proactively add unit tests that deliver real value on every non-trivial
change — not only when explicitly asked — and actively look for gaps in
the surrounding code while touching it. A test has to be a real check:

- It exercises actual behavior/branching, not a mock's own return value.
- It would fail if the logic broke — asserting on a mock's call args or a
  trivially-true assertion proves nothing.
- It covers the edge case that actually breaks naive logic — a message
  from the wrong `origin`, a `requestId` that doesn't match the call in
  flight, a popup the browser silently blocked — not just the first
  value that happens to pass.

`core/bridge.ts`'s origin/requestId validation, `core/popup.ts`'s
blocked-popup timeout, and `core/iframe.ts`'s backdrop-dismiss/resize
handling are exactly the class of logic this project has to get right —
real `vitest` + `jsdom` tests (a real `window`, real
`postMessage`/`MessageEvent`), not mocks standing in for the DOM. What
genuinely can't be automated — a real popup completing a real
`identify → verify → wallets → sign` round trip against a real `one-id` —
is verified manually before a release, not encoded as a flaky/mocked
test pretending to cover it.

## Code style

- **Reuse before writing.** `core/` holds every piece of state/logic
  exactly once; `ui/klappay-button.ts`, `ui/auto-wire.ts`, and
  `react/index.ts` are all thin callers into `core/createKlappayOne` —
  never a second implementation of opening the popup or parsing a
  message.
- **Split files along real seams, not line counts.** `core/klappay-one.ts`
  orchestrating several closely-related steps is fine at any length;
  split when a file mixes genuinely distinct concerns.
- **Avoid `as` type assertions** except a narrow, already-validated case
  (`as const` for literal narrowing). Reach for a type guard on
  `event.data` first — a message from `window` is exactly the kind of
  unproven-shape value that rule exists for.
- **Never nest a ternary inside another ternary's branch.**
- **Extract a constant once a magic number/string has real meaning and
  appears more than once** (the ready-timeout duration, a `postMessage`
  type string, an error code) — keep it next to the logic that owns it
  unless a second, genuinely unrelated file needs the same value.

## Comments

No comments in code, by default. Naming and structure should make intent
obvious. The narrow exception: something genuinely non-obvious (a
browser/Shadow DOM quirk, a deliberate simplification, a subtle
invariant) gets a short comment naming the *why*, not the *what*. Inside
a test, a short comment explaining why an assertion isn't the
naively-expected value is fine — not a license to narrate what the test
does.

## Releases (Changesets)

Publishing is a two-step, human-gated process, not a direct `npm publish`
on every push. `pnpm changeset` picks the bump — never auto-inferred from
the diff. `.github/workflows/ci.yml`'s `changeset-check` job fails a PR
with no changeset. `.github/workflows/release.yml` opens/updates a
"Version Packages" PR on `main`; merging *that* PR is the actual publish
trigger. **Never run or merge those proactively** — they need explicit
go-ahead every time.

The CDN copy (`js.klappay.com`) is a separate, manual step from the npm
publish for now — nothing here auto-syncs the CDN URL to a new npm
version yet.

## Parallelize independent work

Default to running independent file reads/edits/investigations/
verification passes in parallel rather than one after another — whichever
actually shortens wall-clock time. Never leave behind scratch/coordination
files created only to support that split.
