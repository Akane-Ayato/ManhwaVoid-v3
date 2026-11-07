import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface Props {
  icon: ReactNode;
  title: string;
  tone: 'hot' | 'warm' | 'cool' | 'plain';
  to?: string;
  action?: ReactNode;
}

export default function SectionHeading({ icon, title, tone, to, action }: Props) {
  return (
    <div className="section-heading">
      <h2 className={`tone-${tone}`}>{icon}<span>{title}</span></h2>
      {action ?? (to && <Link to={to} className="view-all">View all <ArrowRight size={15} /></Link>)}
    </div>
  );
}
