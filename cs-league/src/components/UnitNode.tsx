import { Lock, Check, Star } from 'lucide-react';
import { TopicMeta } from '../lib/types';

export default function UnitNode({
  unit,
  status,
  offset,
  onClick,
}: {
  unit: TopicMeta;
  status: 'locked' | 'active' | 'complete';
  offset: number;
  onClick: () => void;
}) {
  return (
    <div className="path-row" style={{ transform: `translateX(${offset}px)` }}>
      <div className="unit-node-wrap">
        <button
          className={`unit-node ${status}`}
          onClick={onClick}
          disabled={status === 'locked'}
          aria-label={unit.name}
        >
          {status === 'locked' && <Lock size={26} />}
          {status === 'active' && <Star size={30} fill="#06210F" />}
          {status === 'complete' && <Check size={30} strokeWidth={3} />}
        </button>
        <div className="unit-node-label">{unit.name}</div>
      </div>
    </div>
  );
}
