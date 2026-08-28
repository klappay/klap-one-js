const FRAME_WIDTH = 420
const INITIAL_FRAME_HEIGHT = 720

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
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
    }
    .frame {
      width: ${FRAME_WIDTH}px;
      max-width: calc(100vw - 32px);
      height: ${INITIAL_FRAME_HEIGHT}px;
      max-height: calc(100vh - 32px);
      border: none;
      border-radius: 12px;
      background: #000;
      transition: height 0.15s ease;
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

  return {
    close: () => host.remove(),
    resize: (height) => {
      frame.style.height = `${height}px`
    },
  }
}
