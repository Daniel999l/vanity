# Solana Vanity Wallet Generator — Build Spec

## What This Is
A browser-based Solana vanity wallet generator. User types a prefix and/or suffix, hits generate, and the app brute-forces keypairs until it finds one that matches. Entirely client-side. No server. No storage. Nothing leaves the browser.

---

## Stack
- React + Vite
- Tailwind CSS
- `@solana/web3.js` (browser build)
- Web Worker (for brute force loop, keeps UI responsive)

---

## Core Behavior

### Input
- **Prefix field** — characters the wallet address should START with (optional)
- **Suffix field** — characters the wallet address should END with (optional)
- At least one of prefix or suffix must be filled before generation starts
- Case sensitive (Solana addresses are base58)
- Warn user if they enter characters not in base58 alphabet (no 0, O, I, l)

### Generation
- Runs entirely inside a Web Worker
- Worker generates `Keypair.generate()` in a tight loop
- Checks if `publicKey.toBase58()` starts with prefix AND/OR ends with suffix
- Every 1000 attempts, posts progress back to main thread
- On match, posts the result back and stops

### Worker code (exact):
```javascript
import { Keypair } from "@solana/web3.js";

self.onmessage = ({ data }) => {
  const { prefix, suffix } = data;
  let attempts = 0;

  while (true) {
    const kp = Keypair.generate();
    const pub = kp.publicKey.toBase58();
    attempts++;

    const matchesPrefix = prefix ? pub.toLowerCase().startsWith(prefix.toLowerCase()) : true;
    const matchesSuffix = suffix ? pub.toLowerCase().endsWith(suffix.toLowerCase()) : true;

    if (matchesPrefix && matchesSuffix) {
      self.postMessage({
        found: true,
        publicKey: pub,
        secretKey: Array.from(kp.secretKey),
        attempts,
      });
      return;
    }

    if (attempts % 1000 === 0) {
      self.postMessage({ found: false, attempts });
    }
  }
};
```

### On Match
- Stop the worker immediately
- Show the result section (see UI below)
- Display public key — copyable
- Display private key as a JSON array — copyable
- Show a big red warning: "Save your private key now. We do not store it. Close this tab and it's gone forever."
- Show a "Generate Another" button that clears everything and resets

### Stop Button
- While generating, show a Stop button
- Clicking it terminates the worker and resets state

---

## UI Layout

### Header
- Title: "Vanity Wallet Generator"
- Subtitle: "Generate a custom Solana wallet address that starts or ends with whatever you want. Runs entirely in your browser — nothing is ever sent to a server."

### Input Section
- Two inputs side by side: Prefix | Suffix
- Placeholder text: "e.g. degen" | "e.g. sol"
- Below inputs: a small note — "Longer patterns take longer. 4 chars = seconds. 6 chars = hours."
- Base58 character set note: "Valid characters: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

### Generate Button
- Big, full width
- Text: "Generate Wallet"
- While running: disabled, shows spinner + "Searching..."

### Live Stats (while generating)
- Attempts counter — updates every 1000 attempts, large number, animates
- Elapsed time in seconds
- Estimated speed: attempts/second

### Result Section (after match found)
- Green success banner: "Wallet found after X attempts"
- Public Key — monospace, full width, copy button
- Private Key — monospace, full width, copy button, blurred by default with "Click to reveal" toggle
- BIG RED WARNING BOX:
  ```
  ⚠️ SAVE YOUR PRIVATE KEY NOW
  We do not store your private key anywhere.
  Close this tab and it is gone forever.
  Import it into Phantom or Solflare immediately.
  ```
- "Generate Another" button

---

## Design
- Dark theme. Background #0a0a0a or similar near-black
- Accent color: purple or green (crypto native feel)
- Monospace font for keys (JetBrains Mono or similar via Google Fonts)
- Clean, minimal — no clutter
- Mobile responsive

---

## Security Notes (for README)
- All keypair generation happens in the browser via Web Worker
- Private key is displayed once and never stored, logged, or transmitted
- Public key may optionally be logged client-side for analytics but is NOT currently implemented
- User should immediately import private key into a wallet (Phantom, Solflare) and verify the address before funding it

---

## Performance Note
Warn the user in the UI that:
- 4 character match: seconds to minutes
- 5 characters: minutes to hours
- 6+ characters: could take days
- Recommend keeping patterns to 4 chars or less for practical use

---

## Deployment
- Deploy to Vercel
- No backend needed, static site
- Set `vite.config.js` to handle Web Worker correctly:
```javascript
export default {
  worker: {
    format: 'es'
  }
}
```

---

## What NOT to Do
- Do NOT send any keypair data to a server
- Do NOT log or store private keys anywhere
- Do NOT save anything to localStorage
- Do NOT use a backend for generation

---

## Final Output
A live Vercel URL that works. Test it yourself — generate a wallet with a 3 character prefix before shipping.
