import { Flame, Zap, Snowflake } from 'lucide-react';
import { SessionSummary } from '../lib/gamification';

export default function Summary({
  summary,
  onDone,
}: {
  summary: SessionSummary;
  onDone: () => void;
}) {
  const accuracy = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0;
  const perfect = summary.total > 0 && summary.correct === summary.total;

  return (
    <div className="summary-shell">
      <div className="summary-badge">
        <Zap size={56} color="#06210F" fill="#06210F" />
      </div>
      <h1 style={{ margin: '0 0 6px' }}>
        {perfect ? 'Perfect lesson!' : 'Lesson complete!'}
      </h1>
      <div style={{ color: 'var(--text-muted)' }}>
        {summary.correct} / {summary.total} correct &middot; {accuracy}% accuracy
      </div>

      <div className="summary-stats">
        <div className="summary-stat">
          <div className="num" style={{ color: 'var(--gold)' }}>
            +{summary.xpEarned}
          </div>
          <div className="label">XP earned</div>
        </div>
        <div className="summary-stat">
          <div className="num" style={{ color: 'var(--gem)' }}>
            +{summary.gemsEarned}
          </div>
          <div className="label">Gems earned</div>
        </div>
        <div className="summary-stat">
          <div className="num" style={{ color: 'var(--flame)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Flame size={22} fill="currentColor" />
            {summary.streak}
          </div>
          <div className="label">Day streak</div>
        </div>
        <div className="summary-stat">
          <div className="num" style={{ color: 'var(--text)' }}>
            {accuracy}%
          </div>
          <div className="label">Accuracy</div>
        </div>
      </div>

      {summary.usedFreeze && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--gem)',
            fontSize: 14,
            marginBottom: 18,
          }}
        >
          <Snowflake size={16} />
          A streak freeze covered a missed day.
        </div>
      )}

      <button className="btn btn-primary" onClick={onDone}>
        Nice!
      </button>
    </div>
  );
}
