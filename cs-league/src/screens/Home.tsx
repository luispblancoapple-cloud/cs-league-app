import { useMemo, useState } from 'react';
import { Gem, Clock } from 'lucide-react';
import { AppState, Manifest, TopicMeta } from '../lib/types';
import {
  orderedUnits,
  isUnitComplete,
  currentActiveUnit,
  dueReviewQuestions,
} from '../lib/srs';
import { timeUntilNextHeart } from '../lib/hearts';
import TopBar from '../components/TopBar';
import UnitNode from '../components/UnitNode';
import UnitSheet from '../components/UnitSheet';

const OFFSET_PATTERN = [0, 68, 96, 68, 0, -68, -96, -68];

export default function Home({
  state,
  manifest,
  onStartDaily,
  onStartUnit,
  onSettings,
  onStats,
  onRefillHearts,
}: {
  state: AppState;
  manifest: Manifest;
  onStartDaily: () => void;
  onStartUnit: (topicId: string) => void;
  onSettings: () => void;
  onStats: () => void;
  onRefillHearts: () => void;
}) {
  const units = useMemo(() => orderedUnits(manifest.topics), [manifest]);
  const active = useMemo(() => currentActiveUnit(state, manifest, units), [state, manifest, units]);
  const dueCount = useMemo(() => dueReviewQuestions(state, manifest).length, [state, manifest]);
  const [openUnit, setOpenUnit] = useState<TopicMeta | null>(null);

  const outOfHearts = state.hearts <= 0;
  const nextHeartTime = timeUntilNextHeart(state);

  return (
    <div className="app-shell">
      <TopBar state={state} onSettings={onSettings} onStats={onStats} />
      <div className="home-scroll">
        <div className="unit-banner">
          <div className="eyebrow">
            Unit {units.findIndex((u) => u.id === active.id) + 1} of {units.length}
          </div>
          <h2>
            {isUnitComplete(state, manifest, active.id) ? 'All units complete — keep reviewing!' : active.name}
          </h2>
        </div>

        <div className="path">
          {units.map((u, i) => {
            const complete = isUnitComplete(state, manifest, u.id);
            const status = complete ? 'complete' : 'active';
            return (
              <UnitNode
                key={u.id}
                unit={u}
                status={status as any}
                offset={OFFSET_PATTERN[i % OFFSET_PATTERN.length]}
                onClick={() => setOpenUnit(u)}
              />
            );
          })}
        </div>
      </div>

      <div className="bottom-cta">
        {outOfHearts ? (
          <div style={{ width: '100%', maxWidth: 520 }}>
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-light)',
                borderRadius: 16,
                padding: '14px 16px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <Clock size={18} />
              {nextHeartTime
                ? `Out of hearts — next one in ${nextHeartTime}`
                : 'Out of hearts'}
            </div>
            <button className="btn btn-primary" onClick={onRefillHearts} disabled={state.gems < 30}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Gem size={18} /> Refill for 30 gems
              </span>
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onStartDaily}>
            {dueCount > 0 ? `Today's lesson · ${dueCount} due for review` : "Start today's lesson"}
          </button>
        )}
      </div>

      {openUnit && (
        <UnitSheet
          unit={openUnit}
          state={state}
          manifest={manifest}
          onClose={() => setOpenUnit(null)}
          onPractice={() => {
            if (outOfHearts) return;
            const id = openUnit.id;
            setOpenUnit(null);
            onStartUnit(id);
          }}
        />
      )}
    </div>
  );
}
