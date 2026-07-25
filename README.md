# Vanity Wallet Generator

A browser-based Solana vanity wallet generator. Enter a prefix and/or suffix, generate a matching wallet address, and keep everything local to your browser.

## Live Demo

Try it live: `https://your-live-demo-url-here`

## Repository

Clone the project:

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app in your browser:

```text
http://localhost:5173/
```

## What It Does

- Generates Solana keypairs entirely in the browser
- Uses a Web Worker so the UI stays responsive during brute force search
- Supports prefix and suffix matching
- Shows the generated public key and private key locally, with no server involved

## Security Notes

- No private key data is sent to a server
- Nothing is stored in localStorage
- The private key is shown once and can be copied locally
- Close the tab and the generated wallet is gone

## Tech Stack

- React
- Vite
- Tailwind CSS
- `@solana/web3.js`
- Web Workers

## Deployment

This is a static frontend app, so it can be deployed to Vercel or any other static host.

## Replace These Placeholders

- Live demo URL: `https://your-live-demo-url-here`
- GitHub repo URL: `https://github.com/your-username/your-repo-name.git`
