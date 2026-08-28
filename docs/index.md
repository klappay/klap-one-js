---
layout: home

hero:
  name: '@klappay/one'
  text: The embeddable Klappay payment button
  tagline: Drop it on any page — it opens a modal or popup that handles identity, wallet connection, and payment approval entirely on Klappay's own origin, then reports the result back to you.
  image:
    src: /logo.png
    alt: '@klappay/one'
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/klappay/klap-one-js

features:
  - title: Zero-JS drop-in
    details: '<klappay-button charge-id="ch_123"> or a plain <button data-klappay-one="ch_123"> — both wire up automatically once the script loads.'
    link: /button
  - title: Programmatic API
    details: createKlappayOne(config).open() for full control over when the checkout opens and how results are handled.
    link: /programmatic
  - title: React
    details: A thin <KlappayButton /> wrapper and a useKlappayOne() hook — no separate implementation, both call straight into the same core.
    link: /react
  - title: Any other framework
    details: The core is a framework-agnostic Web Component — Vue, Svelte, Angular, or plain HTML all use the exact same element.
    link: /frameworks
  - title: iframe or popup, picked for you
    details: Desktop defaults to an iframe/modal, mobile to a popup — with an automatic iframe-to-popup fallback if a merchant CSP blocks the frame.
    link: /modes
  - title: Never a proof of payment
    details: onSuccess is a UX signal only — real fulfillment comes from Klappay Core's charge.confirmed webhook. The docs explain exactly why.
    link: /protocol
  - title: Runnable examples
    details: Four full, clone-and-run apps — vanilla/no-bundler, Next.js, Nuxt, and SvelteKit — each creating a real charge and rendering the button end to end.
    link: /examples
---
