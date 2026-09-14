import { useState } from 'react';
import { ArrowLeft, Cloud, CloudOff } from 'lucide-react';
import { AppState } from '../lib/types';
import { firebaseEnabled } from '../lib/firebase';
import { defaultState } from '../lib/storage';

export default function Settings({
  state,
  onChange,
  onBack,
}: {
  state: AppState;
  onChange: (s: AppState) => void;
  onBack: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div>
      <div className="page-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <h1>Settings</h1>
      </div>
      <div className="settings-shell">
        <div className="settings-row">
          <div>
            <div className="label">Daily goal</div>
            <div className="desc">Questions per lesson</div>
          </div>
          <div className="stepper">
            <button
              onClick={() => onChange({ ...state, dailyGoal: Math.max(5, state.dailyGoal - 5) })}
            >
              −
            </button>
            <div className="val">{state.dailyGoal}</div>
            <button
              onClick={() => onChange({ ...state, dailyGoal: Math.min(40, state.dailyGoal + 5) })}
            >
              +
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <div className="label">Cloud sync</div>
            <div className="desc">
              {firebaseEnabled
                ? 'Connected — progress syncs to Firebase.'
                : 'Not configured — progress is saved to this browser only. See README.md to enable Firebase sync.'}
            </div>
          </div>
          {firebaseEnabled ? <Cloud size={20} color="var(--green)" /> : <CloudOff size={20} color="var(--text-dim)" />}
        </div>

        <div className="settings-row">
          <div>
            <div className="label">Total sessions</div>
          </div>
          <div>{state.sessionsCompleted}</div>
        </div>

        <div className="settings-row">
          <div>
            <div className="label">Longest streak</div>
          </div>
          <div>{state.longestStreak} days</div>
        </div>

        <div style={{ marginTop: 30 }}>
          {!confirmReset ? (
            <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
              Reset all progress
            </button>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                This wipes XP, streak, gems, and all question history. This can't be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-danger" onClick={() => onChange(defaultState())}>
                  Yes, reset
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
