export function playReadyNotification(): void {
  if (typeof window === "undefined") return;

  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, start);
  oscillator.frequency.setValueAtTime(880, start + 0.12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.35);
  oscillator.addEventListener("ended", () => {
    void context.close();
  });

  void context.resume().catch(() => {
    void context.close();
  });
}
