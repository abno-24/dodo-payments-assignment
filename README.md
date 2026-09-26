# Dodo Checkout — Embeddable Checkout Assignment

A tiny embeddable checkout: a drop-in SDK script, a hosted checkout app that runs inside an iframe, and a demo store showing it all working together.

**Live demo:** https://dodo-store-site.vercel.app
**Checkout app (hosted separately):** https://dodo-checkout-app-iota.vercel.app
**Repo:** https://github.com/abno-24/dodo-payments-assignment

Test cards:
- `4242 4242 4242 4242` — succeeds
- `4000 0000 0000 0002` — declines
- `4000 0000 0000 0341` — fails once, then succeeds on retry

---

## How to run it locally

The project has three parts, each in its own folder: `sdk`, `checkout-app`, `demo-site`.

```bash
# 1. Build the SDK
cd sdk
npm install
npm run build              # outputs sdk/dist/index.js

# 2. Copy the built SDK into the demo site (demo-site "hosts" the script)
cp dist/index.js ../dodo-store/public/dodo-checkout.js

# 3. Run the checkout app
cd ../checkout-app
npm install
npm run dev                 # runs on http://localhost:5173

# 4. In a separate terminal, run the demo site
cd ../demo-site
npm install
npm run dev                  # runs on http://localhost:5174
```

Open the demo site URL, click **Buy now**, and try the test cards above.

> Note: `sdk/src/index.ts` has a `CHECKOUT_URL` constant pointing at the checkout app's URL. It's currently set to the deployed production URL. If running fully locally, change it to `http://localhost:5173`, rebuild, and re-copy into `demo-site/public/`.

---

## How the pieces talk to each other

```
Host page (any website)
   │
   │  <script src=".../dodo-checkout.js">
   │  DodoCheckout.open({ productId, onSuccess, onClose, onError })
   ▼
SDK (sdk/) — plain TypeScript, one file, no dependencies
   │  creates a full-screen overlay + <iframe> pointing at the checkout app
   │  listens for window "message" events
   ▼
Checkout app (checkout-app/) — React, runs inside the iframe
   │  loads product info, shows the form, simulates the payment
   │  sends messages back to the parent via window.parent.postMessage(...)
   ▼
back to SDK → SDK calls the matching callback (onSuccess / onClose / onError)
   → SDK removes the iframe and hands focus back to the host page
```

**Message contract** (checkout app → SDK, via `postMessage`):

| Message | When it's sent |
|---|---|
| `{ type: "READY" }` | As soon as the checkout iframe has loaded — confirms it's alive before anything else happens |
| `{ type: "SUCCESS", sessionId }` | Payment succeeded |
| `{ type: "ERROR", code, message }` | Something unrecoverable happened (bad `productId`, load timeout) |
| `{ type: "CLOSED", reason }` | The checkout closed — `reason` is `"user_closed"` or `"success"` |

The SDK validates `event.origin` against the checkout app's known origin before trusting any incoming message — without this check, any script on the host page (or elsewhere) could fake a `SUCCESS` message.

**What the host page never sees:** card number, email, which step the customer is on, retry attempts, or anything else typed into the form. Only a session ID (on success), a close reason, or a generic error code/message ever crosses the boundary back to the host.

---

## Two decisions I went back and forth on

**1. What crosses the boundary back to the host page.**
It would have been easier to just pass more information back — e.g. the email typed, or which step failed — since it's convenient for a host site's own analytics. I decided against it: the host page shouldn't be able to observe anything about what a customer does inside the checkout beyond the outcome. A malicious or just poorly-written host script shouldn't be able to scrape checkout behavior. So the message contract is deliberately narrow: a session ID on success, a close reason, or a generic error code — nothing else.

**2. Whether to allow closing the checkout mid-payment.**
When a payment is `processing`, should Esc / the ✕ button still work? Allowing it gives the user more control and feels more "responsive." But it creates a real problem: if someone closes the checkout while `simulatePayment()` is still resolving, there's no honest answer to "did it go through?" — the SDK would have already fired `onClose`, but the payment might still succeed a moment later with nowhere to report it. I chose to disable both the ✕ button and Esc while `isSubmitting` is true, so the checkout always finishes telling the truth about what happened before it can be dismissed.

---

## What I'd explore next

- **Stricter origin scoping for outgoing messages.** The SDK currently uses `postMessage(data, "*")` when the checkout app replies to the parent, since the host's origin isn't known in advance. A more locked-down version could have the host register its own origin when initializing the SDK (`DodoCheckout.init({ allowedOrigin: ... })`), so the checkout app can target that specific origin instead of `"*"`.
- **A real backend and payment gateway.** Right now `simulatePayment()` is pure client-side logic keyed off the card number. A real version would call a backend, which would call an actual payment processor, with the checkout app only ever talking to its own backend — never touching real card data beyond collecting it for a tokenization step.
- **Automated tests.** The payment simulation logic (`fakePayment.ts`) and input validation (`validation.ts`) are pure functions and would be easy to unit test. The SDK ↔ checkout app message contract is the highest-value thing to cover with an integration test, since it's the part most likely to silently break.

---

## What I intentionally left out

- **Theming/customization** — the brief left it open how much a host site should be able to change about the checkout's appearance. I decided to keep the surface area small: the only required input is `productId`. Letting hosts inject arbitrary styling or content would also widen the security surface for very little payoff in a project this size.
- **A design-system / component library** — the checkout app is small enough that plain Tailwind utility classes stayed easier to reason about than introducing a UI library.
