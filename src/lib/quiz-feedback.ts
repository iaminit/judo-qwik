let wrongAnswerAudio: HTMLAudioElement | undefined;

export const triggerQuizConfetti = () => {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "99999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    "#ef4444",
    "#22c55e",
    "#3b82f6",
    "#eab308",
    "#ec4899",
    "#a855f7",
    "#06b6d4",
  ];
  const particles = Array.from({ length: 70 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * 160,
    y: canvas.height / 3 + (Math.random() - 0.5) * 100,
    size: Math.random() * 8 + 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -10 - 4,
    rotation: Math.random() * 360,
    vRotation: (Math.random() - 0.5) * 10,
    alpha: 1,
  }));

  let animationFrame = 0;
  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.35;
      particle.vx *= 0.98;
      particle.rotation += particle.vRotation;
      particle.alpha -= 0.014;

      if (particle.alpha <= 0) return;
      active = true;
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size,
      );
      ctx.restore();
    });

    if (active) {
      animationFrame = requestAnimationFrame(render);
      return;
    }

    cancelAnimationFrame(animationFrame);
    canvas.remove();
  };

  render();
};

export const playQuizFeedbackSound = (type: "correct" | "wrong") => {
  if (typeof window === "undefined") return;

  try {
    if (type === "wrong") {
      wrongAnswerAudio ??= new Audio("/media/audio/errore.mp3");
      wrongAnswerAudio.currentTime = 0;
      void wrongAnswerAudio.play().catch((error) => {
        console.error("Error sound playback failed:", error);
      });
      return;
    }

    const AudioCtx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (error) {
    console.error("Quiz feedback sound failed:", error);
  }
};
