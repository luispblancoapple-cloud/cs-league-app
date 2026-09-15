let correctAudio: HTMLAudioElement | null = null;
let incorrectAudio: HTMLAudioElement | null = null;

function getAudio(kind: 'correct' | 'incorrect'): HTMLAudioElement {
  if (kind === 'correct') {
    if (!correctAudio) correctAudio = new Audio(`${import.meta.env.BASE_URL}sounds/correct.mp3`);
    return correctAudio;
  }
  if (!incorrectAudio) incorrectAudio = new Audio(`${import.meta.env.BASE_URL}sounds/incorrect.mp3`);
  return incorrectAudio;
}

export function playSound(kind: 'correct' | 'incorrect') {
  try {
    const audio = getAudio(kind);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Autoplay can be blocked before the user has interacted with the page;
      // safe to ignore since a tap always precedes this in normal use.
    });
  } catch {
    // ignore - sound is a nice-to-have, never block the app on it
  }
}
