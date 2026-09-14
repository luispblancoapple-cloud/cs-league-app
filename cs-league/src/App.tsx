import { useEffect, useRef, useState } from 'react';
import manifestData from './manifest.json';
import { AppState, Manifest, SessionQuestion, SessionResult } from './lib/types';
import { loadState, persistState } from './lib/storage';
import { applyAnswer, orderedUnits, buildDailyLesson, buildUnitPractice } from './lib/srs';
import { applySessionCompletion, refreshFreeze, SessionSummary } from './lib/gamification';
import Home from './screens/Home';
import Lesson from './screens/Lesson';
import Summary from './screens/Summary';
import Settings from './screens/Settings';

const manifest = manifestData as unknown as Manifest;

type View = 'home' | 'lesson' | 'summary' | 'settings';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>('home');
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (state && loaded.current) {
      persistState(state);
    }
  }, [state]);

  if (!state) {
    return <div className="loading-screen">Loading your progress…</div>;
  }

  const units = orderedUnits(manifest.tests);

  function startDaily() {
    const qs = buildDailyLesson(state!, manifest, units);
    setSessionQuestions(qs);
    setView('lesson');
  }

  function startUnit(testId: number) {
    const qs = buildUnitPractice(state!, manifest, testId).slice(0, 40);
    setSessionQuestions(qs);
    setView('lesson');
  }

  function finishLesson(results: SessionResult[]) {
    let s = state!;
    for (const r of results) {
      s = applyAnswer(s, r.qid, r.correct);
    }
    const correctCount = results.filter((r) => r.correct).length;
    const { state: newState, summary: sum } = applySessionCompletion(s, results.length, correctCount);
    const finalState = refreshFreeze(newState);
    setState(finalState);
    setSummary(sum);
    setView('summary');
  }

  return (
    <>
      {view === 'home' && (
        <Home
          state={state}
          manifest={manifest}
          onStartDaily={startDaily}
          onStartUnit={startUnit}
          onSettings={() => setView('settings')}
        />
      )}
      {view === 'lesson' && (
        <Lesson
          questions={sessionQuestions}
          onFinish={finishLesson}
          onExit={() => setView('home')}
        />
      )}
      {view === 'summary' && summary && (
        <Summary summary={summary} onDone={() => setView('home')} />
      )}
      {view === 'settings' && (
        <Settings state={state} onChange={setState} onBack={() => setView('home')} />
      )}
    </>
  );
}
