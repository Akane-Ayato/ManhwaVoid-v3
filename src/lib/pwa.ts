import { useEffect, useState } from 'react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/* Chromium browsers (Chrome/Edge/Brave/Opera on Windows, Linux, macOS, Android) fire this once,
   possibly before React mounts, so it is captured at startup and kept at module level. */
let deferred: InstallPromptEvent | null = null;
let helpOpen = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => { deferred = null; helpOpen = false; notify(); });

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined); });
  }
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: window-controls-overlay)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export type OS = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'other';
export type Browser = 'chrome' | 'edge' | 'brave' | 'opera' | 'firefox' | 'safari' | 'samsung' | 'other';

/** Best-effort platform sniffing. Only used to pick which instructions to show, never to gate the install. */
export function detectPlatform(): { os: OS; browser: Browser } {
  const ua = navigator.userAgent;
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPadOS 13+ pretends to be a Mac
  let os: OS = 'other';
  if (/iphone|ipad|ipod/i.test(ua) || touchMac) os = 'ios';
  else if (/android/i.test(ua)) os = 'android';
  else if (/windows/i.test(ua)) os = 'windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'mac';
  else if (/linux|cros|x11/i.test(ua)) os = 'linux';

  let browser: Browser = 'other';
  if ('brave' in navigator) browser = 'brave';
  else if (/edg(e|a|ios)?\//i.test(ua)) browser = 'edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'samsung';
  else if (/firefox|fxios/i.test(ua)) browser = 'firefox';
  else if (/chrome|crios|chromium/i.test(ua)) browser = 'chrome';
  else if (/safari/i.test(ua)) browser = 'safari';
  return { os, browser };
}

/**
 * State + action for every "Install app" button.
 * - If the browser offered a native prompt, install() shows it.
 * - Otherwise install() opens a platform-specific help dialog (iOS Share sheet, browser menu, etc.),
 *   so the button always does something useful instead of silently failing.
 */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const installed = isStandalone();
  return {
    installed,
    /** Show the button: always, unless the app is already running installed. */
    available: !installed,
    /** A native one-click prompt is ready. */
    canPrompt: !!deferred && !installed,
    helpOpen,
    closeHelp: () => { helpOpen = false; notify(); },
    install: async () => {
      if (deferred) {
        const ev = deferred;
        deferred = null;
        notify();
        await ev.prompt();
        await ev.userChoice;
      } else {
        helpOpen = true;
        notify();
      }
    },
  };
}
