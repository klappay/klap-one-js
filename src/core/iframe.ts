const FRAME_WIDTH = 420
// The real content height arrives via klappay:resize once one-id has
// something to report — this is just a small, neutral "loading" size so
// the modal doesn't pop in at a height that has nothing to do with
// whatever screen ends up rendering. It then grows/shrinks into place
// with the same transition a later resize() uses.
const LOADING_FRAME_HEIGHT = 360
const TRANSITION_MS = 200
// A pronounced ease-out — most of the motion happens up front, so the
// modal feels like it's settling into place rather than still catching up
// by the time someone starts reading it.
const TRANSITION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

export interface IframeHandle {
  close: () => void
  resize: (height: number) => void
}

function css(): string {
  return `
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
      transform: translateY(-16px);
      transition:
        height ${TRANSITION_MS}ms ${TRANSITION_EASING},
        opacity ${TRANSITION_MS}ms ${TRANSITION_EASING},
        transform ${TRANSITION_MS}ms ${TRANSITION_EASING};
    }
    .frame.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `
}

// A modal overlay + <iframe>, isolated in Shadow DOM so neither the
// merchant page's CSS nor ours can leak across the boundary — same
// isolation reasoning as ui/klappay-button.ts. Dismissing via a backdrop
// click reports as a cancel, same as closing the popup does.
export function openIframe(url: string, onDismiss: () => void): IframeHandle {
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = css()

  const backdrop = document.createElement('div')
  backdrop.className = 'backdrop'
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) onDismiss()
  })

  const frame = document.createElement('iframe')
  frame.className = 'frame'
  frame.src = url

  backdrop.append(frame)
  shadow.append(style, backdrop)
  document.body.append(host)

  // The backdrop already covers the full viewport, but the merchant's own
  // page behind it can still be taller than the screen — without this, it
  // keeps scrolling right along with the modal open on top of it.
  // `overflow: hidden` alone doesn't reliably stop that (a wheel/trackpad
  // gesture can still move window.scrollY in some browsers even with it
  // set on both <html> and <body>) — pinning <body> itself with `position:
  // fixed` is what actually removes it from the scrollable area, the same
  // technique every body-scroll-lock library uses. Restored once the
  // modal is actually gone, not when close() is first called, so the page
  // doesn't jump/reflow while the exit transition is still playing.
  const scrollY = window.scrollY
  const previousBodyPosition = document.body.style.position
  const previousBodyTop = document.body.style.top
  const previousBodyWidth = document.body.style.width
  const previousBodyOverflow = document.body.style.overflow
  const previousHtmlOverflow = document.documentElement.style.overflow
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'

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
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      window.scrollTo(0, scrollY)
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
  }
}
