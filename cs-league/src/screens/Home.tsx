import { useMemo, useState } from 'react';
import { AppState, Manifest, TestMeta } from '../lib/types';
import {
  orderedUnits,
  isUnitComplete,
  isUnitUnlocked,
  currentActiveUnit,
  dueReviewQuestions,
} from '../lib/srs';
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
}: {
  state: AppState;
  manifest: Manifest;
  onStartDaily: () => void;
  onStartUnit: (testId: number) => void;
  onSettings: () => void;
}) {
  const units = useMemo(() => orderedUnits(manifest.tests), [manifest]);
  const active = useMemo(() => currentActiveUnit(state, manifest, units), [state, manifest, units]);
  const dueCount = useMemo(() => dueReviewQuestions(state, manifest).length, [state, manifest]);
  const [openUnit, setOpenUnit] = useState<TestMeta | null>(null);

  return (
    <div className="app-shell">
      <TopBar state={state} onSettings={onSettings} />
      <div className="home-scroll">
        <div className="unit-banner">
          <div className="eyebrow">
            {active.level} &middot; {active.year}
          </div>
          <h2>
            {isUnitComplete(state, manifest, active.id)
              ? 'All units complete — keep reviewing!'
              : `Unit ${units.findIndex((u) => u.id === active.id) + 1} of ${units.length}`}
          </h2>
        </div>

        <div className="path">
          {units.map((u, i) => {
            const complete = isUnitComplete(state, manifest, u.id);
            const unlocked = isUnitUnlocked(state, manifest, units, u.id);
            const status = complete ? 'complete' : unlocked ? 'active' : 'locked';
            return (
              <UnitNode
                key={u.id}
                unit={u}
                status={status as any}
                offset={OFFSET_PATTERN[i % OFFSET_PATTERN.length]}
                onClick={() => unlocked && setOpenUnit(u)}
              />
            );
          })}
        </div>
      </div>

      <div className="bottom-cta">
        <button className="btn btn-primary" onClick={onStartDaily}>
          {dueCount > 0 ? `Today's lesson · ${dueCount} due for review` : "Start today's lesson"}
        </button>
      </div>

      {openUnit && (
        <UnitSheet
          unit={openUnit}
          state={state}
          manifest={manifest}
          onClose={() => setOpenUnit(null)}
          onPractice={() => {
            const id = openUnit.id;
            setOpenUnit(null);
            onStartUnit(id);
          }}
        />
      )}
    </div>
  );
}
