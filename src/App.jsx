import React, { useEffect, useMemo, useRef, useState } from 'react';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function isBase58Pattern(value) {
  return [...value].every((char) => BASE58.includes(char));
}

function formatSeconds(totalSeconds) {
  return `${totalSeconds.toFixed(1)}s`;
}

function copyText(text) {
  return navigator.clipboard.writeText(text);
}

export default function App() {
  const workerRef = useRef(null);
  const startedAtRef = useRef(0);
  const attemptsRef = useRef(0);

  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [status, setStatus] = useState('');
  const [warning, setWarning] = useState('');
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showArrayFormat, setShowArrayFormat] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const canGenerate = prefix.trim().length > 0 || suffix.trim().length > 0;
  const prefixValid = isBase58Pattern(prefix);
  const suffixValid = isBase58Pattern(suffix);
  const patternWarning = useMemo(() => {
    const invalid = [];
    if (prefix && !prefixValid) invalid.push('prefix');
    if (suffix && !suffixValid) invalid.push('suffix');
    return invalid.length
      ? `Invalid ${invalid.join(' and ')} characters detected. Use the base58 alphabet only.`
      : '';
  }, [prefix, prefixValid, suffix, suffixValid]);

  useEffect(() => {
    let timer = null;
    if (running) {
      timer = window.setInterval(() => {
        const now = performance.now();
        const seconds = (now - startedAtRef.current) / 1000;
        setElapsed(seconds);
        setSpeed(seconds > 0 ? attemptsRef.current / seconds : 0);
      }, 200);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [running]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const stopWorker = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
  };

  const resetAll = () => {
    stopWorker();
    attemptsRef.current = 0;
    setAttempts(0);
    setElapsed(0);
    setSpeed(0);
    setStatus('');
    setWarning('');
    setResult(null);
    setRevealed(false);
    setShowArrayFormat(false);
  };

  const startSearch = () => {
    if (!canGenerate || patternWarning) {
      setWarning(patternWarning || 'Enter a prefix or suffix to begin.');
      return;
    }

    resetAll();
    setWarning('');
    setStatus('Searching for a matching Solana address...');
    setRunning(true);
    startedAtRef.current = performance.now();
    attemptsRef.current = 0;

    const worker = new Worker(new URL('./vanity.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = ({ data }) => {
      if (data.found) {
        attemptsRef.current = data.attempts;
        setAttempts(data.attempts);
        setResult(data);
        setRunning(false);
        setStatus('Wallet found.');
        worker.terminate();
        workerRef.current = null;
        return;
      }

      attemptsRef.current = data.attempts;
      setAttempts(data.attempts);
      setStatus(`Still searching... ${data.attempts.toLocaleString()} attempts so far.`);
    };

    worker.onerror = () => {
      setWarning('The worker stopped unexpectedly. Please try again.');
      stopWorker();
    };

    worker.postMessage({ prefix, suffix, caseSensitive });
  };

  const handleGenerateAnother = () => {
    setPrefix('');
    setSuffix('');
    resetAll();
  };

  const warningText = warning || patternWarning;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="page-decor" aria-hidden="true">
        <div className="page-decor__shape page-decor__shape--one" />
        <div className="page-decor__shape page-decor__shape--two" />
        <div className="page-decor__shape page-decor__shape--three" />
      </div>
      <div className="relative z-10 mx-auto flex min-h-screen w-[min(100%,72rem)] flex-col gap-4 px-5 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:justify-center lg:px-10 lg:py-10">
        <header className="neo-card bg-[var(--panel)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 inline-block rounded-none border-2 border-black bg-[var(--accent-yellow)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-[0.22em] text-black shadow-[4px_4px_0_#000]">
                Client-side Solana Tool
              </p>
              <h1 className="font-display text-3xl uppercase leading-[0.92] tracking-[-0.03em] text-black sm:text-5xl lg:text-7xl">
                Vanity Wallet Generator
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#40362d] sm:mt-4 sm:text-lg sm:leading-7">
                Generate a custom Solana wallet address that starts or ends with whatever you want.
                Runs entirely in your browser, so nothing is ever sent to a server.
              </p>
            </div>
            <div className="neo-chip w-full min-w-0 lg:w-auto">
              <span className="font-display text-sm uppercase tracking-[0.18em]">No backend</span>
              <span className="font-mono text-xs">Web Worker brute force</span>
            </div>
          </div>
        </header>

        <section className="neo-card grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block min-w-0 w-full">
                <span className="neo-label">Prefix</span>
                <input
                  className="neo-input"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.trim())}
                  placeholder="e.g. degen"
                  spellCheck="false"
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </label>
              <label className="block min-w-0 w-full">
                <span className="neo-label">Suffix</span>
                <input
                  className="neo-input"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value.trim())}
                  placeholder="e.g. sol"
                  spellCheck="false"
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="neo-note">
              <p>Longer patterns take longer. 4 chars = seconds. 6 chars = hours.</p>
              <p className="mt-2 font-mono text-xs text-[var(--muted)]">
                Valid characters: {BASE58}
              </p>
            </div>

            <label className="case-toggle">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              <span>
                <strong>Exact case match</strong>
                <small>
                  Off means Liq can match liq, LIQ, LiQ, or any other case variation. On means only
                  the exact letters you typed.
                </small>
              </span>
            </label>

            {warningText ? <div className="neo-alert neo-alert--danger">{warningText}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              {!running ? (
                <button className="neo-button neo-button--primary w-full" onClick={startSearch}>
                  Generate Wallet
                </button>
              ) : (
                <button className="neo-button neo-button--danger w-full" onClick={stopWorker}>
                  Stop
                </button>
              )}
              {result ? (
                <button className="neo-button w-full sm:w-auto" onClick={handleGenerateAnother}>
                  Generate Another
                </button>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="neo-stat">
              <span className="neo-stat__label">Attempts</span>
              <span className="neo-stat__value">{attempts.toLocaleString()}</span>
            </div>
            <div className="neo-stat">
              <span className="neo-stat__label">Elapsed</span>
              <span className="neo-stat__value">{formatSeconds(elapsed)}</span>
            </div>
            <div className="neo-stat">
              <span className="neo-stat__label">Speed</span>
              <span className="neo-stat__value">
                {speed ? `${Math.round(speed).toLocaleString()}/s` : '0/s'}
              </span>
            </div>
            <div className="neo-note">
              <p className="font-display text-sm uppercase tracking-[0.16em] text-black">
                Performance guide
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5b5145]">
                4 character match: seconds to minutes. 5 characters: minutes to hours. 6+ characters:
                could take days.
              </p>
            </div>
          </aside>
        </section>

        {status ? <div className="neo-banner">{status}</div> : null}

        {result ? (
          <section className="neo-card space-y-5">
            <div className="rounded-none border-[3px] border-black bg-[var(--accent-green)] px-4 py-3 text-black shadow-[6px_6px_0_#000]">
              <p className="font-display text-xl uppercase tracking-[0.06em]">
                Wallet found after {result.attempts.toLocaleString()} attempts
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SecretField
                label="Public Key"
                value={result.publicKey}
                mono
                copyLabel="Copy public key"
              />
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="neo-label mb-0">Private Key</span>
                  <button className="neo-link" onClick={() => setRevealed((value) => !value)}>
                    {revealed ? 'Hide' : 'Click to reveal'}
                  </button>
                </div>
                <div className="neo-copybox">
                  <pre className="neo-pre">
                    {revealed
                      ? showArrayFormat
                        ? JSON.stringify(result.secretKey)
                        : result.secretKeyBase58
                      : 'Hidden until you click reveal'}
                  </pre>
                  <button className="neo-mini-button" onClick={() => setShowArrayFormat((value) => !value)}>
                    {showArrayFormat ? 'Show base58' : 'Show array'}
                  </button>
                  <button
                    className="neo-mini-button"
                    onClick={() =>
                      copyText(showArrayFormat ? JSON.stringify(result.secretKey) : result.secretKeyBase58)
                    }
                  >
                    Copy private key
                  </button>
                </div>
              </div>
            </div>

            <div className="neo-alert neo-alert--danger">
              <p className="font-display text-lg uppercase tracking-[0.06em]">
                Save your private key now
              </p>
              <p className="mt-2 leading-7">
                We do not store your private key anywhere. Close this tab and it is gone forever.
                Import it into Phantom or Solflare immediately.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function SecretField({ label, value, copyLabel, mono }) {
  return (
    <div className="space-y-3">
      <span className="neo-label mb-0">{label}</span>
      <div className="neo-copybox">
        <pre className={mono ? 'neo-pre' : 'neo-pre neo-pre--wrap'}>{value}</pre>
        <button className="neo-mini-button" onClick={() => copyText(value)}>
          {copyLabel}
        </button>
      </div>
    </div>
  );
}
