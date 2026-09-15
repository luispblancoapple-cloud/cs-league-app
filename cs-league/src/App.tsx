import { useEffect, useRef, useState } from 'react';
import manifestData from './manifest.json';
import { AppState, Manifest, SessionQuestion, SessionResult } from './lib/types';
import { loadState, persistState } from './lib/storage';
import { applyAnswer, orderedUnits, buildDailyLesson, buildUnitPractice } from './lib/srs';
import { applySessionCompletion, refreshFreeze, SessionSummary } from './lib/gamification';
import { refillHeartsForElapsedTime, loseHeart, refillWithGems } from './lib/hearts';
import Home from './screens/Home';
import Lesson from './screens/Lesson';
import Summary from './screens/Summary';
import OutOfHearts from './screens/OutOfHearts';
import Settings from './screens/Settings';

const manifest = manifestData as unknown as Manifest;

type View = 'home' | 'lesson' | 'summary' | 'out-of-hearts' | 'settings';

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>('home');
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [partialResult, setPartialResult] = useState<{ correct: number; total: number } | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    loadState().then((s) => {
      setState(refillHeartsForElapsedTime(s));
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

  const units = orderedUnits(manifest.topics);

  function startDaily() {
    const refreshed = refillHeartsForElapsedTime(state!);
    if (refreshed !== state) setState(refreshed);
    if (refreshed.hearts <= 0) return;
    const qs = buildDailyLesson(refreshed, manifest, units);
    setSessionQuestions(qs);
    setView('lesson');
  }

  function startUnit(topicId: string) {
    const refreshed = refillHeartsForElapsedTime(state!);
    if (refreshed !== state) setState(refreshed);
    if (refreshed.hearts <= 0) return;
    const qs = buildUnitPractice(refreshed, manifest, topicId).slice(0, 40);
    setSessionQuestions(qs);
    setView('lesson');
  }

  function handleWrongAnswer() {
    setState((prev) => (prev ? loseHeart(prev) : prev));
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

  function handleOutOfHearts(results: SessionResult[]) {
    let s = state!;
    for (const r of results) {
      s = applyAnswer(s, r.qid, r.correct);
    }
    setState(s);
    setPartialResult({
      correct: results.filter((r) => r.correct).length,
      total: results.length,
    });
    setView('out-of-hearts');
  }

  function refillHearts() {
    setState((prev) => {
      if (!prev) return prev;
      return refillWithGems(prev) ?? prev;
    });
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
          onRefillHearts={refillHearts}
        />
      )}
      {view === 'lesson' && (
        <Lesson
          questions={sessionQuestions}
          initialHearts={state.hearts}
          onWrongAnswer={handleWrongAnswer}
          onFinish={finishLesson}
          onOutOfHearts={handleOutOfHearts}
          onExit={() => setView('home')}
        />
      )}
      {view === 'summary' && summary && (
        <Summary summary={summary} onDone={() => setView('home')} />
      )}
      {view === 'out-of-hearts' && partialResult && (
        <OutOfHearts
          state={state}
          correct={partialResult.correct}
          total={partialResult.total}
          onRefill={() => {
            refillHearts();
            setView('home');
          }}
          onDone={() => setView('home')}
        />
      )}
      {view === 'settings' && (
        <Settings state={state} onChange={setState} onBack={() => setView('home')} />
      )}
    </>
  );
}
