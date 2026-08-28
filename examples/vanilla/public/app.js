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
