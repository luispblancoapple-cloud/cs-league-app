import { X } from 'lucide-react';
import { AppState, Manifest, TestMeta } from '../lib/types';
import { unitQuestions, unitSeenCount, qid, getStat } from '../lib/srs';

export default function UnitSheet({
  unit,
  state,
  manifest,
  onClose,
  onPractice,
}: {
  unit: TestMeta;
  state: AppState;
  manifest: Manifest;
  onClose: () => void;
  onPractice: () => void;
}) {
  const qs = unitQuestions(manifest, unit.id);
  const seen = unitSeenCount(state, manifest, unit.id);
  const correct = qs.reduce((acc, q) => acc + getStat(state, qid(q.testId, q.number)).correct, 0);
  const pct = Math.round((seen / qs.length) * 100);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn"
          onClick={onClose}
          style={{ float: 'right' }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="eyebrow" style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {unit.level}
        </div>
        <h2>{unit.year} UIL Computer Science</h2>
        <div className="sub">
          {seen} / {qs.length} questions practiced &middot; {correct} correct all-time
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <button className="btn btn-primary" onClick={onPractice}>
          {seen === 0 ? 'Start unit' : seen < qs.length ? 'Continue unit' : 'Practice again'}
        </button>
      </div>
    </div>
  );
}
