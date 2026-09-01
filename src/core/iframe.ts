const FRAME_WIDTH = 420
// The real content height arrives via klappay:resize once one-id has
// something to report — this is just a small, neutral "loading" size so
// the modal doesn't pop in at a height that has nothing to do with
// whatever screen ends up rendering. It then grows/shrinks into place
// with the same transition a later resize() uses.
const LOADING_FRAME_HEIGHT = 360
// A floor so a short step (e.g. identify, just an OTP input) doesn't look
// cramped on a tall desktop window — capped at 70vh so it never forces a
// short browser window into overflow just to hit this floor; a genuinely
// taller step still grows past it exactly like today.
const MIN_FRAME_HEIGHT = 480
const TRANSITION_MS = 320
// A pronounced ease-out — most of the motion happens up front, so the
// modal feels like it's settling into place rather than still catching up
// by the time someone starts reading it.
const TRANSITION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

export interface IframeHandle {
  close: () => void
  resize: (height: number) => void
  setDismissable: (canDismiss: boolean) => void
}

// Built once at module load, not per open() call — the CSS only ever
// depends on the module-level constants above, which never change at
// runtime.
const IFRAME_CSS = `
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      /* "safe" keeps the top of the frame reachable by scrolling instead
         of clipped off-screen — plain "center" alone can make overflowing
         centered flex content unscrollable in that direction. The plain
         center above is a fallback for browsers that don't understand the
         safe keyword; an unsupported value is ignored, not applied. */
      align-items: center;
      align-items: safe center;
      overflow-y: auto;
      padding: 16px 0;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity ${TRANSITION_MS}ms ${TRANSITION_EASING};
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }
    .backdrop.visible {
      opacity: 1;
    }
    .backdrop::-webkit-scrollbar {
      width: 8px;
    }
    .backdrop::-webkit-scrollbar-track {
      background: transparent;
    }
    .backdrop::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }
    .backdrop::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    .frame {
      width: ${FRAME_WIDTH}px;
      max-width: calc(100vw - 32px);
      height: ${LOADING_FRAME_HEIGHT}px;
      min-height: min(${MIN_FRAME_HEIGHT}px, 70vh);
      /* No max-height clamp — one-id measures its own content against the
         height it's actually given via resize(), with no idea this box
         might otherwise get cut shorter than that. Clamping here would
         leave its content taller than what we then render, showing a
         scrollbar inside the iframe itself that we have no way to style
         (a different, cross-origin document). The backdrop above scrolls
         instead when a real step genuinely doesn't fit the viewport. */
      flex-shrink: 0;
      border: none;
      border-radius: 12px;
      background: #000;
      opacity: 0;
      transform: translateY(-32px) scale(0.96);
      transition:
        height ${TRANSITION_MS}ms ${TRANSITION_EASING},
        opacity ${TRANSITION_MS}ms ${TRANSITION_EASING},
        transform ${TRANSITION_MS}ms ${TRANSITION_EASING};
    }
    .frame.visible {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  `

// A modal overlay + <iframe>, isolated in Shadow DOM so neither the
// merchant page's CSS nor ours can leak across the boundary — same
// isolation reasoning as ui/klappay-button.ts. Dismissing via a backdrop
// click reports as a cancel, same as closing the popup does.
export function openIframe(url: string, onDismiss: () => void): IframeHandle {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = IFRAME_CSS

  // Gated by setDismissable() below — once a payment attempt is past the
  // point of no return (the wallet has been asked to sign/send), a
  // backdrop click must not silently orphan it the way closing the modal
  // otherwise would.
  let dismissable = true

  const backdrop = document.createElement('div')
  backdrop.className = 'backdrop'
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop && dismissable) onDismiss()
  })

  const frame = document.createElement('iframe')
  frame.className = 'frame'
  frame.src = url

  backdrop.append(frame)
  shadow.append(style, backdrop)
  document.body.append(host)

  // The backdrop already covers the full viewport, but the merchant's own
  // page behind it can still be taller than the screen — without this, a
  // wheel/trackpad gesture over the backdrop keeps scrolling it right along
  // with the modal open on top. This never touches the merchant page's own
  // <body>/<html> (no inline styles, nothing to restore) — same technique
  // react-remove-scroll (what Radix's Dialog/Popover use under the hood)
  // applies: only cancel a wheel/touch gesture once the backdrop itself has
  // nowhere left to scroll in that direction, so it still scrolls normally
  // on its own long content instead of just blocking everything outright.
  function preventScrollChaining(event: WheelEvent): void {
    const atTop = backdrop.scrollTop <= 0
    const atBottom = backdrop.scrollTop + backdrop.clientHeight >= backdrop.scrollHeight
    if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
      event.preventDefault()
    }
  }
  document.addEventListener('wheel', preventScrollChaining, { passive: false })

  // The elements have to actually paint in their initial (invisible)
  // state before adding `visible` for the transition to run — flipping
  // both in the same tick the host is inserted would just skip straight
  // to the end state with nothing to animate from.
  let entered = false
  function enter(): void {
    if (entered) return
    entered = true
    backdrop.classList.add('visible')
    frame.classList.add('visible')
  }
  requestAnimationFrame(enter)
  // Same belt-and-suspenders reasoning as the close() fallback below —
  // requestAnimationFrame is throttled to a stop for a backgrounded tab,
  // which would otherwise leave the modal stuck at opacity: 0 (invisible,
  // but still very much open) until the tab regains focus.
  setTimeout(enter, TRANSITION_MS)

  let closed = false
  function close(): void {
    if (closed) return
    closed = true

    let removed = false
    function remove(): void {
      if (removed) return
      removed = true
      document.removeEventListener('wheel', preventScrollChaining)
      host.remove()
    }

    function onTransitionEnd(event: TransitionEvent): void {
      // `transitionend` bubbles — the frame's own opacity/transform/height
      // transitions would otherwise trigger this early, cutting the
      // backdrop's fade short.
      if (event.target !== backdrop) return
      backdrop.removeEventListener('transitionend', onTransitionEnd)
      remove()
    }
    backdrop.addEventListener('transitionend', onTransitionEnd)
    // Belt-and-suspenders in case transitionend never fires (e.g. close()
    // is called before the entering rAF above ever ran, so there's no
    // `visible` state to transition away from) — never leaves the modal
    // stuck in the DOM.
    setTimeout(remove, TRANSITION_MS + 50)

    backdrop.classList.remove('visible')
    frame.classList.remove('visible')
  }

  return {
    close,
    resize: (height) => {
      frame.style.height = `${height}px`
    },
    setDismissable: (canDismiss) => {
      dismissable = canDismiss
    },
  }
}
