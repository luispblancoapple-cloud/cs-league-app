import { Flame, Gem, Zap, Settings, Heart } from 'lucide-react';
import { AppState } from '../lib/types';

export default function TopBar({
  state,
  onSettings,
}: {
  state: AppState;
  onSettings: () => void;
}) {
  return (
    <div className="topbar">
      <div className="stat-pill" style={{ color: 'var(--red)' }}>
        <Heart size={18} fill="currentColor" />
        {state.hearts}
      </div>
      <div className="stat-pill flame">
        <Flame size={20} fill="currentColor" />
        {state.streak}
      </div>
      <div className="stat-pill gem">
        <Gem size={18} fill="currentColor" />
        {state.gems}
      </div>
      <div className="stat-pill xp">
        <Zap size={18} fill="currentColor" />
        {state.xp}
      </div>
      <div className="topbar-spacer" />
      <button className="icon-btn" onClick={onSettings} aria-label="Settings">
        <Settings size={18} />
      </button>
    </div>
  );
}
