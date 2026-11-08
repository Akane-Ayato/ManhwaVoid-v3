import { SITE } from '../config';

/** Emblem + two-tone wordmark ("Manhwa" / "Void"). The wordmark is real text so it stays crisp and themable. */
export default function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  const words = SITE.name.split(' ');
  const last = words.length > 1 ? words.pop() : '';
  return (
    <span className="logo-lockup" style={{ ['--logo-size' as string]: `${size}px` }}>
      <img src={SITE.mark} alt={showText ? '' : SITE.name} width={size} height={size} className="logo-mark" />
      {showText && (
        <span className="logo-text" aria-label={SITE.name}>
          <span>{words.join(' ')}</span>{last && <b>{last}</b>}
        </span>
      )}
    </span>
  );
}
