import { useState } from 'react';
import { X, Heart, Check, XCircle } from 'lucide-react';
import { SessionQuestion, SessionResult } from '../lib/types';
import { playSound } from '../lib/sound';

const ALL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

export default function Lesson({
  questions,
  initialHearts,
  onWrongAnswer,
  onFinish,
  onOutOfHearts,
  onExit,
}: {
  questions: SessionQuestion[];
  initialHearts: number;
  onWrongAnswer: () => void;
  onFinish: (results: SessionResult[]) => void;
  onOutOfHearts: (results: SessionResult[]) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [heartsLeft, setHeartsLeft] = useState(initialHearts);
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [overridden, setOverridden] = useState(false);

  const q = questions[index];
  const total = questions.length;

  function submit() {
    if (submitted) return;
    let correct = false;
    if (q.freeResponse) {
      correct = q.answer !== null && normalize(freeText) === normalize(q.answer);
    } else {
      correct = selected === q.answer;
    }
    setWasCorrect(correct);
    setSubmitted(true);
    if (correct) {
      playSound('correct');
    } else {
      playSound('incorrect');
      onWrongAnswer();
      setHeartsLeft((h) => Math.max(0, h - 1));
    }
  }

  function recordAndAdvance(finalCorrect: boolean) {
    const newResults = [...results, { qid: q.qid, correct: finalCorrect, wasReview: false }];
    setResults(newResults);

    if (!finalCorrect && heartsLeft <= 0) {
      onOutOfHearts(newResults);
      return;
    }
    if (index + 1 >= total) {
      onFinish(newResults);
    } else {
      setIndex(index + 1);
      setSelected(null);
      setFreeText('');
      setSubmitted(false);
      setWasCorrect(false);
      setOverridden(false);
    }
  }

  const options = q.options.length > 0 ? q.options : ALL_LETTERS.slice(0, 5);
  const displayCorrect = overridden ? true : wasCorrect;

  return (
    <div className="lesson-shell">
      <div className="lesson-header">
        <button className="close-btn" onClick={onExit} aria-label="Exit lesson">
          <X size={26} />
        </button>
        <div className="lesson-progress-track">
          <div
            className="lesson-progress-fill"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <div className="hearts">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} size={18} fill={i < heartsLeft ? 'currentColor' : 'none'} />
          ))}
        </div>
      </div>

      <div className="question-area">
        <div className="question-image-wrap">
          <img src={`${import.meta.env.BASE_URL}questions/${q.image}`} alt={`Question ${q.number}`} />
        </div>

        {q.freeResponse ? (
          <>
            <div className="prompt-label">Type your answer</div>
            <input
              className="free-response-input"
              value={freeText}
              disabled={submitted}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Your answer..."
              autoFocus
            />
          </>
        ) : (
          <>
            <div className="prompt-label">Choose the correct answer</div>
            <div className="answer-grid">
              {options.map((opt) => {
                let cls = 'answer-btn';
                if (submitted) {
                  if (opt === q.answer) cls += ' correct';
                  else if (opt === selected) cls += ' incorrect';
                } else if (opt === selected) {
                  cls += ' selected';
                }
                return (
                  <button
                    key={opt}
                    className={cls}
                    disabled={submitted}
                    onClick={() => setSelected(opt)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className={`feedback-bar ${submitted ? (displayCorrect ? 'correct' : 'incorrect') : 'idle'}`}>
        <div className="feedback-inner">
          {submitted && (
            <>
              <div className={`feedback-title ${displayCorrect ? 'correct' : 'incorrect'}`}>
                {displayCorrect ? <Check size={22} /> : <XCircle size={22} />}
                {displayCorrect
                  ? 'Correct!'
                  : !overridden && heartsLeft <= 0
                    ? 'Out of hearts!'
                    : 'Not quite'}
              </div>
              {!wasCorrect && (
                <div className="correct-answer-line">
                  Correct answer: <b>{q.answer}</b>
                </div>
              )}
              {q.explanation && (
                <div className="feedback-explanation">{q.explanation}</div>
              )}
              {!wasCorrect && q.freeResponse && !overridden && (
                <button
                  className="btn btn-secondary"
                  style={{ marginBottom: 10 }}
                  onClick={() => setOverridden(true)}
                >
                  I was actually right
                </button>
              )}
            </>
          )}
          <button
            className="btn btn-primary"
            onClick={submitted ? () => recordAndAdvance(displayCorrect) : submit}
            disabled={
              !submitted && (q.freeResponse ? freeText.trim().length === 0 : !selected)
            }
          >
            {submitted
              ? !displayCorrect && heartsLeft <= 0
                ? 'See results'
                : index + 1 >= total
                  ? 'Finish'
                  : 'Continue'
              : 'Check'}
          </button>
        </div>
      </div>
    </div>
  );
}
