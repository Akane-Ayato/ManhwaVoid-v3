import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Info } from 'lucide-react';
import { getSiteConfig, type PublicSiteConfig } from '../lib/api';

export default function SiteAnnouncement() {
  const [config, setConfig] = useState<PublicSiteConfig | null>(null);
  useEffect(() => { let alive = true; getSiteConfig().then((value) => { if (alive) setConfig(value); }).catch(() => undefined); return () => { alive = false; }; }, []);
  if (!config) return null;
  if (config.maintenance_mode) return <div className="site-notice maintenance"><AlertTriangle size={17} /><span><b>Scheduled maintenance</b> — ManhwaVoid is temporarily unavailable while we make improvements.</span></div>;
  if (!config.announcement_enabled || !config.announcement_title && !config.announcement_body) return null;
  return <div className="site-notice"><Info size={17} /><span><b>{config.announcement_title}</b>{config.announcement_body ? ` — ${config.announcement_body}` : ''}</span>{config.announcement_link && <a href={config.announcement_link} target="_blank" rel="noreferrer">Details <ArrowUpRight size={14} /></a>}</div>;
}
