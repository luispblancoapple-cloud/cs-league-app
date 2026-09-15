import { Heart, Gem, Clock } from 'lucide-react';
import { AppState } from '../lib/types';
import { timeUntilNextHeart } from '../lib/hearts';

export default function OutOfHearts({
  state,
  correct,
  total,
  onRefill,
  onDone,
}: {
  state: AppState;
  correct: number;
  total: number;
  onRefill: () => void;
  onDone: () => void;
}) {
  const nextHeartTime = timeUntilNextHeart(state);
  const canRefill = state.gems >= 30;

  return (
    <div className="summary-shell">
      <div className="summary-badge" style={{ background: 'var(--red)', boxShadow: '0 8px 0 #A5393D' }}>
        <Heart size={56} color="white" fill="white" />
      </div>
      <h1 style={{ margin: '0 0 6px' }}>Out of hearts!</h1>
      <div style={{ color: 'var(--text-muted)' }}>
        You got {correct} / {total} right before running out.
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontSize: 14,
          margin: '20px 0',
        }}
      >
        <Clock size={16} />
        {nextHeartTime ? `Next heart in ${nextHeartTime}` : 'Hearts refilling...'}
      </div>

      <button className="btn btn-primary" onClick={onRefill} disabled={!canRefill} style={{ marginBottom: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Gem size={18} /> Refill all hearts for 30 gems
        </span>
      </button>
      <button className="btn btn-ghost" onClick={onDone}>
        I'll wait
      </button>
    </div>
  );
}
