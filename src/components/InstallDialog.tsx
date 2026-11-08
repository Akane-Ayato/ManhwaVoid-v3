import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share, MoreVertical, MonitorDown, Smartphone, AlertTriangle } from 'lucide-react';
import { detectPlatform, useInstall, type Browser, type OS } from '../lib/pwa';
import { SITE } from '../config';

interface Guide { title: string; steps: React.ReactNode[]; note?: string }

function guideFor(os: OS, browser: Browser): Guide {
  const app = SITE.name;
  if (os === 'ios') {
    return {
      title: 'Install on iPhone / iPad',
      steps: [
        <>Open this page in <b>Safari</b> (other iOS browsers work too on iOS 16.4+).</>,
        <>Tap the <b>Share</b> button <Share size={14} className="ins-ico" /> in the toolbar.</>,
        <>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</>,
      ],
      note: `${app} will appear on your home screen and open full-screen like an app.`,
    };
  }
  if (os === 'android') {
    if (browser === 'samsung') {
      return { title: 'Install on Android', steps: [<>Tap the menu <b>☰</b> at the bottom right.</>, <>Tap <b>Add page to</b> → <b>Home screen</b>.</>, <>Confirm with <b>Add</b>.</>] };
    }
    if (browser === 'firefox') {
      return { title: 'Install on Android', steps: [<>Tap the menu <MoreVertical size={14} className="ins-ico" />.</>, <>Tap <b>Install</b> (or <b>Add to Home screen</b>).</>, <>Confirm with <b>Add</b>.</>] };
    }
    return {
      title: 'Install on Android',
      steps: [
        <>Tap the browser menu <MoreVertical size={14} className="ins-ico" /> (top right).</>,
        <>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</>,
        <>Confirm with <b>Install</b>.</>,
      ],
    };
  }
  // Desktop
  if (browser === 'firefox') {
    return {
      title: 'Install on desktop',
      steps: [<>Firefox on desktop can’t install web apps yet.</>, <>Open this page in <b>Chrome</b>, <b>Edge</b> or <b>Brave</b> and use its install option.</>],
    };
  }
  if (browser === 'safari' && os === 'mac') {
    return {
      title: 'Install on Mac',
      steps: [<>In the menu bar choose <b>File → Add to Dock…</b></>, <>Click <b>Add</b>.</>],
      note: 'Needs macOS Sonoma (14) or newer.',
    };
  }
  const where: Record<string, string> = {
    edge: 'Menu ⋯ → Apps → Install this site as an app',
    brave: 'Menu ☰ → Install Manhwa Void… (or the install icon at the right end of the address bar)',
    opera: 'Install icon at the right end of the address bar',
    chrome: 'Menu ⋮ → Cast, save and share → Install page as app… (or the install icon in the address bar)',
  };
  return {
    title: `Install on ${os === 'windows' ? 'Windows' : os === 'mac' ? 'Mac' : os === 'linux' ? 'Linux' : 'desktop'}`,
    steps: [
      <>Look for the install icon <MonitorDown size={14} className="ins-ico" /> at the right end of the address bar and click it.</>,
      <>Or use the browser menu: <b>{where[browser] ?? where.chrome}</b>.</>,
      <>Click <b>Install</b>. The app gets its own window and a Start menu / app launcher entry.</>,
    ],
  };
}

/** Mounted once. Opens when an "Install app" button is pressed and the browser has no native prompt to show. */
export default function InstallDialog() {
  const { helpOpen, closeHelp, installed } = useInstall();

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeHelp();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [helpOpen, closeHelp]);

  if (!helpOpen || installed) return null;
  const { os, browser } = detectPlatform();
  const g = guideFor(os, browser);
  const insecure = !window.isSecureContext;

  return createPortal(
    <div className="modal-backdrop" onClick={closeHelp}>
      <div className="modal ins" role="dialog" aria-modal="true" aria-label="Install app" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong><Smartphone size={16} style={{ verticalAlign: '-3px', marginRight: 8 }} />{g.title}</strong>
          <button className="icon-btn" onClick={closeHelp} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="ins-body">
          {insecure && (
            <div className="ins-warn">
              <AlertTriangle size={16} />
              <span>This page is opened over plain <b>http</b>, so browsers hide the one-click install. It works automatically on <b>https</b> (your deployed site) or <b>localhost</b>.</span>
            </div>
          )}
          <ol className="ins-steps">
            {g.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {g.note && <p className="ins-note">{g.note}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
