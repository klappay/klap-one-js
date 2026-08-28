const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod/i

// Mirrors klap-one's web/src/lib/is-mobile.ts exactly — same heuristic,
// same reasoning: mobile defaults to the popup renderer instead of the
// iframe/modal one, since whether a backgrounded iframe's WalletConnect
// relay connection survives the OS switching to the wallet app and back
// hasn't been verified, unlike a top-level popup tab.
export function isMobileUserAgent(userAgent: string): boolean {
  return MOBILE_USER_AGENT_PATTERN.test(userAgent)
}
