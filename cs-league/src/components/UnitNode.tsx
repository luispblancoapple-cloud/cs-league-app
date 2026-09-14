import { Lock, Check, Star } from 'lucide-react';
import { TestMeta } from '../lib/types';

export default function UnitNode({
  unit,
  status,
  offset,
  onClick,
}: {
  unit: TestMeta;
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
          aria-label={`${unit.level} ${unit.year}`}
        >
          {status === 'locked' && <Lock size={26} />}
          {status === 'active' && <Star size={30} fill="#06210F" />}
          {status === 'complete' && <Check size={30} strokeWidth={3} />}
        </button>
        <div className="unit-node-label">
          {unit.level} '{unit.year.slice(2)}
        </div>
      </div>
    </div>
  );
}
