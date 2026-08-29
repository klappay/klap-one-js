const status = document.getElementById('status')
const startButton = document.getElementById('start')

startButton.addEventListener('click', async () => {
  startButton.disabled = true
  status.textContent = 'Creating charge…'

  const [{ chargeId }, { origin }] = await Promise.all([
    fetch('/api/charges', { method: 'POST' }).then((r) => r.json()),
    fetch('/api/config').then((r) => r.json()),
  ])

  status.textContent = 'Opening checkout…'

  KlappayOne.createKlappayOne({
    chargeId,
    origin,
    onReady: () => {
      status.textContent = 'Checkout ready.'
    },
    onSuccess: (result) => {
      status.textContent = `Paid! tx: ${result.txHash}`
      startButton.disabled = false
    },
    onError: (error) => {
      status.textContent = `Error: ${error.message}`
      startButton.disabled = false
    },
    onCancel: () => {
      status.textContent = 'Checkout closed.'
      startButton.disabled = false
    },
  }).open()
})

const componentStatus = document.getElementById('component-status')
const generateButton = document.getElementById('generate-button')
const originInput = document.getElementById('origin-input')
const chargeIdInput = document.getElementById('charge-id-input')
const checkout = document.getElementById('checkout')

// Renders disabled on its own until both charge-id/origin are set — the lib
// handles that reactively, so it's mounted once up front rather than
// created on Generate.
const previewButton = document.createElement('klappay-button')
checkout.append(previewButton)

previewButton.addEventListener('success', (event) => {
  componentStatus.textContent = `Paid! tx: ${event.detail.txHash}`
})
previewButton.addEventListener('error', (event) => {
  componentStatus.textContent = `Error: ${event.detail.message}`
})
previewButton.addEventListener('cancel', () => {
  componentStatus.textContent = 'Checkout closed.'
})

function updateGenerateButton() {
  const ready = originInput.value.trim() && chargeIdInput.value.trim()
  generateButton.disabled = !ready
  generateButton.textContent = ready ? 'Generate button' : 'Fill in origin and charge ID first'
}

originInput.addEventListener('input', updateGenerateButton)
chargeIdInput.addEventListener('input', updateGenerateButton)
updateGenerateButton()

fetch('/api/config')
  .then((r) => r.json())
  .then(({ origin }) => {
    if (origin) originInput.value = origin
    updateGenerateButton()
  })

generateButton.addEventListener('click', () => {
  componentStatus.textContent = ''
  previewButton.setAttribute('origin', originInput.value.trim())
  previewButton.setAttribute('charge-id', chargeIdInput.value.trim())
})
