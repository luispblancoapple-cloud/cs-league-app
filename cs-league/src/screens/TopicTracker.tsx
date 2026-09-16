import { ArrowLeft } from 'lucide-react';
import { AppState, Manifest } from '../lib/types';
import { orderedUnits, topicStats } from '../lib/srs';

function barColor(pct: number | null): string {
  if (pct === null) return 'var(--border-light)';
  if (pct >= 80) return 'var(--green)';
  if (pct >= 60) return 'var(--gold)';
  return 'var(--red)';
}

export default function TopicTracker({
  state,
  manifest,
  onBack,
}: {
  state: AppState;
  manifest: Manifest;
  onBack: () => void;
}) {
  const units = orderedUnits(manifest.topics);

  return (
    <div>
      <div className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <h1>Topic tracker</h1>
      </div>
      <div className="settings-shell">
        {units.map((u) => {
          const s = topicStats(state, manifest, u.id);
          return (
            <div key={u.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    color: barColor(s.accuracyPct),
                  }}
                >
                  {s.accuracyPct === null ? '—' : `${s.accuracyPct}%`}
                </div>
              </div>
              <div className="progress-bar-track" style={{ margin: '4px 0 6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${s.accuracyPct ?? 0}%`,
                    background: barColor(s.accuracyPct),
                  }}
                />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                {s.seenQuestions} / {s.totalQuestions} questions seen
                {s.attempts > 0 && (
                  <> &middot; {s.correctAttempts} / {s.attempts} correct (all attempts)</>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
