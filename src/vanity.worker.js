import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

self.onmessage = ({ data }) => {
  const { prefix, suffix, caseSensitive } = data;
  let attempts = 0;

  while (true) {
    const kp = Keypair.generate();
    const pub = kp.publicKey.toBase58();
    attempts++;

    const candidate = caseSensitive ? pub : pub.toLowerCase();
    const prefixValue = caseSensitive ? prefix : prefix.toLowerCase();
    const suffixValue = caseSensitive ? suffix : suffix.toLowerCase();
    const matchesPrefix = prefix ? candidate.startsWith(prefixValue) : true;
    const matchesSuffix = suffix ? candidate.endsWith(suffixValue) : true;

    if (matchesPrefix && matchesSuffix) {
      self.postMessage({
        found: true,
        publicKey: pub,
        secretKey: Array.from(kp.secretKey),
        secretKeyBase58: bs58.encode(kp.secretKey),
        attempts,
      });
      return;
    }

    if (attempts % 1000 === 0) {
      self.postMessage({ found: false, attempts });
    }
  }
};
