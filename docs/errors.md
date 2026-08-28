# Errors

```ts
interface KlappayOneError {
  code: string
  message: string
}
```

`code` is deliberately an open string, not a fixed union type. Most codes
come from `one-id`'s own bridge and can grow over time without a matching
release of this package — treat `code` as a value to log/branch on for the
handful you specifically care about, not an exhaustive list to switch over.

## Codes this package generates itself

Only two — everything else in `onError` originates on Klappay's side and
is forwarded verbatim.

| Code | When | Where |
| --- | --- | --- |
| `POPUP_BLOCKED` | `window.open()` returned `null`, or the returned window is already `.closed` — the browser's popup blocker stepped in. Only reachable on the popup path (mobile default, or `mode: 'popup'`). | `core/klappay-one.ts` |
| `FRAME_TIMEOUT` | No `klappay:ready` message arrived within 10 seconds. On the iframe path, this only fires *after* the [automatic popup fallback](/modes#the-automatic-iframe-popup-fallback) also times out — a CSP blocking the frame doesn't stop there, it retries as a popup first. | `core/klappay-one.ts` / `core/bridge.ts` |

```ts
onError: (error) => {
  if (error.code === 'POPUP_BLOCKED') {
    showMessage('Please allow popups for this site and try again.')
    return
  }
  if (error.code === 'FRAME_TIMEOUT') {
    showMessage('The checkout failed to load. Check your network and try again.')
    return
  }
  showMessage(error.message)
}
```

## Codes from `one-id`

Everything else — `payment_failed`, `wallet_error`, and any code
`one-id`'s own identity/wallet/payment flow raises — is relayed through
`core/bridge.ts` unchanged, as a `klappay:error` message. This package
never inspects or transforms those codes; they're validated for shape
(`code`/`message` both present) but not for a specific known set. Building
a fixed union type here would mean every new error `one-id` introduces
needs a matching release of `@klappay/one` just to keep types accurate —
an open `string` avoids that coupling entirely.

For a UI that wants to handle more than the two codes above, fall back to
displaying `error.message` (already a payer-facing string) for anything
that isn't `POPUP_BLOCKED`/`FRAME_TIMEOUT` specifically, rather than
hard-coding a `switch` over codes that may not exist yet.

## `onCancel` is not an error

Closing the popup/iframe without completing payment — by any means, see
[iframe vs. popup](/modes) — fires `onCancel`, never `onError`. There's no
`code` for "the payer changed their mind"; that's an expected outcome,
not a failure one.
