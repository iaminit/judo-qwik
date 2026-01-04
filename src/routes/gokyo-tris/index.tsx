import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  useContext,
  $,
  type QRL,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { AppContext } from '~/context/app-context';
import { useNavigate } from '@builder.io/qwik-city';

interface Technique {
  id: string;
  name: string;
  kanji?: string;
  group: string;
  image?: string;
}

interface TechniquesData {
  techniques: Technique[];
}

// Sound Engine
const SoundFX = {
  ctx: null as AudioContext | null,
  init: function () {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playTone: function (freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.ctx) this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  move: function () {
    this.playTone(400, 'square', 0.05, 0.05);
  },
  rotate: function () {
    this.playTone(500, 'triangle', 0.05, 0.05);
  },
  drop: function () {
    this.playTone(200, 'sawtooth', 0.1, 0.08);
  },
  lineClear: function () {
    if (!this.ctx) this.init();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.2, 0.1), i * 80);
    });
  },
};

// Game Constants
const COLS = 8;
const ROWS = 16;

const TETROMINOES: Record<string, number[][]> = {
  I: [
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const GOKYO_GROUPS: Record<number, { color: string; name: string }> = {
  1: { color: '#fbbf24', name: 'Dai Ikkyo' },
  2: { color: '#fb923c', name: 'Dai Nikyo' },
  3: { color: '#4ade80', name: 'Dai Sankyo' },
  4: { color: '#60a5fa', name: 'Dai Yonkyo' },
  5: { color: '#8b4513', name: 'Dai Gokyo' },
};

export const useTechniquesData = routeLoader$<TechniquesData>(async () => {
  try {
    console.log('[GokyoTris] Fetching from collection "tecniche"...');
    const records = await pb.collection('tecniche').getFullList({
      sort: '@random',
      requestKey: null,
    });

    // Map to Technique interface including image resolution logic
    const techniques: Technique[] = records.map((t: any) => {
      const techName = t.titolo || '';
      const techGroup = t.tags?.split(',')[0].trim() || '';
      const techKanji = t.titolo_secondario || '';

      // Image resolution logic consistent with /tecniche route
      let slugBase = techName.toLowerCase()
        .trim()
        .replace(/ō/g, 'o')
        .replace(/ū/g, 'u')
        .replace(/ā/g, 'a')
        .replace(/ī/g, 'i')
        .replace(/ē/g, 'e')
        .replace(/[\s/]+/g, '-');

      slugBase = slugBase.replace(/tsuri-?komi/g, 'tsuri-komi');
      slugBase = slugBase.replace(/seoi-?nage/g, 'seoi-nage');
      slugBase = slugBase.replace(/maki-?komi/g, 'maki-komi');
      slugBase = slugBase.replace(/ashi-?guruma/g, 'ashi-guruma');
      slugBase = slugBase.replace(/de-?ashi/g, 'de-ashi');
      slugBase = slugBase.replace(/o-?goshi/g, 'o-goshi');
      slugBase = slugBase.replace(/o-?uchi/g, 'o-uchi');
      slugBase = slugBase.replace(/ko-?uchi/g, 'ko-uchi');
      slugBase = slugBase.replace(/o-?soto/g, 'o-soto');
      slugBase = slugBase.replace(/ko-?soto/g, 'ko-soto');

      const slugBaseClean = slugBase
        .replace(/[^-a-z0-9]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '');

      return {
        id: t.id,
        name: techName,
        kanji: techKanji,
        group: techGroup,
        image: `${slugBaseClean}.webp` // Default fallback, card component will handle missing files
      };
    });

    console.log('[GokyoTris] Prepared', techniques.length, 'techniques');
    return {
      techniques,
    };
  } catch (err) {
    console.error('[GokyoTris] Error loading techniques:', err);
    return {
      techniques: [],
    };
  }
});

export default component$(() => {
  const data = useTechniquesData();
  const nav = useNavigate();
  const appState = useContext(AppContext);

  const canvasRef = useSignal<HTMLCanvasElement>();
  const nextCanvasRef = useSignal<HTMLCanvasElement>();

  const isPlaying = useSignal(false);
  const isGameOver = useSignal(false);
  const score = useStore({ ippon: 0, waza: 0, yuko: 0 });
  const level = useSignal(1);
  const currentTechInfo = useStore({ name: '', kanji: '', image: '' });
  const imageError = useSignal(false);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    appState.sectionTitle = 'Gokyo-Tris';
    appState.sectionIcon = '🕹️';
  });

  // Game logic state
  const gameState = useStore({
    playfield: [] as (string | number)[][],
    tetrominoSequence: [] as string[],
    currentTetromino: null as any,
    nextTetromino: null as any,
    count: 0,
    gameSpeed: 35,
    requestId: 0,
  });

  // Helper functions
  const generateSequence = $(() => {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'Z', 'T'];
    while (sequence.length) {
      const rand = Math.floor(Math.random() * sequence.length);
      const name = sequence.splice(rand, 1)[0];
      gameState.tetrominoSequence.push(name);
    }
  });

  const getNextTetromino = $(async () => {
    if (gameState.tetrominoSequence.length === 0) {
      await generateSequence();
    }
    const name = gameState.tetrominoSequence.pop()!;
    const matrix = TETROMINOES[name];
    const col = Math.floor(COLS / 2) - Math.ceil(matrix[0].length / 2);
    const row = name === 'I' ? -1 : 0;

    // Map to Gokyo
    let gokyoIndex = 1;
    switch (name) {
      case 'L':
        gokyoIndex = 2;
        break;
      case 'I':
        gokyoIndex = 3;
        break;
      case 'O':
        gokyoIndex = 1;
        break;
      case 'J':
        gokyoIndex = 4;
        break;
      case 'T':
        gokyoIndex = 5;
        break;
      case 'S':
        gokyoIndex = 2;
        break;
      case 'Z':
        gokyoIndex = 1;
        break;
    }

    const groupInfo = GOKYO_GROUPS[gokyoIndex];

    // Pick a random technique from this group
    let tech = null;
    if (data.value.techniques.length > 0) {
      const groupTechs = data.value.techniques.filter((t) => t.group === groupInfo.name);
      if (groupTechs.length > 0) {
        tech = groupTechs[Math.floor(Math.random() * groupTechs.length)];
      }
    }

    return {
      name,
      matrix,
      row,
      col,
      color: groupInfo.color,
      gokyoGroup: gokyoIndex,
      techData: tech,
    };
  });

  const rotate = $((matrix: number[][]) => {
    const N = matrix.length - 1;
    return matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
  });

  const isValidMove = $((matrix: number[][], cellRow: number, cellCol: number, playfield: (string | number)[][]) => {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (
          matrix[row][col] &&
          (cellCol + col < 0 ||
            cellCol + col >= COLS ||
            cellRow + row >= ROWS ||
            (playfield[cellRow + row] && playfield[cellRow + row][cellCol + col]))
        ) {
          return false;
        }
      }
    }
    return true;
  });

  const drawNextPiece = $(() => {
    const canvas = nextCanvasRef.value;
    if (!canvas || !gameState.nextTetromino) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { matrix, color } = gameState.nextTetromino;
    const cellSize = 12;
    const offsetX = (canvas.width - matrix[0].length * cellSize) / 2;
    const offsetY = (canvas.height - matrix.length * cellSize) / 2;

    ctx.fillStyle = color;
    matrix.forEach((row: number[], r: number) => {
      row.forEach((value: number, c: number) => {
        if (value) {
          ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize - 1, cellSize - 1);
        }
      });
    });
  });

  const updateScore = $((lines: number) => {
    if (lines >= 4) score.ippon++;
    else if (lines >= 2) score.waza++;
    else score.yuko++;

    level.value = Math.min(level.value + 1, 10);
    gameState.gameSpeed = Math.max(5, 35 - level.value * 2);
  });

  const showGameOver = $(() => {
    if (gameState.requestId) {
      cancelAnimationFrame(gameState.requestId);
    }
    isGameOver.value = true;
    isPlaying.value = false;
  });

  const placeTetromino = $(async () => {
    const { currentTetromino } = gameState;
    if (!currentTetromino) return;

    // Update playfield
    for (let row = 0; row < currentTetromino.matrix.length; row++) {
      for (let col = 0; col < currentTetromino.matrix[row].length; col++) {
        if (currentTetromino.matrix[row][col]) {
          if (currentTetromino.row + row < 0) {
            return await showGameOver();
          }
          gameState.playfield[currentTetromino.row + row][currentTetromino.col + col] =
            currentTetromino.color;
        }
      }
    }

    // Check for lines
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0;) {
      if (gameState.playfield[row].every((cell) => !!cell)) {
        linesCleared++;
        gameState.playfield.splice(row, 1);
        gameState.playfield.unshift(new Array(COLS).fill(0));
      } else {
        row--;
      }
    }

    if (linesCleared > 0) {
      SoundFX.lineClear();
      await updateScore(linesCleared);
    } else {
      SoundFX.drop();
    }

    gameState.currentTetromino = gameState.nextTetromino;
    gameState.nextTetromino = await getNextTetromino();

    // Update displayed technique
    if (gameState.currentTetromino.techData) {
      const t = gameState.currentTetromino.techData;
      const imgPath = t.image.startsWith('http') ? t.image : `/media/${t.image}`;

      currentTechInfo.name = t.name;
      currentTechInfo.kanji = t.kanji || '';
      currentTechInfo.image = imgPath;
      imageError.value = false;
    }

    await drawNextPiece();
  });

  const draw = $(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / COLS;
    const scaleY = canvas.height / ROWS;

    // Draw grid background
    context.fillStyle = 'rgba(0,0,0,0.4)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    context.strokeStyle = '#ddd';
    context.lineWidth = 0.5;
    context.beginPath();
    for (let col = 0; col <= COLS; col++) {
      context.moveTo(col * scaleX, 0);
      context.lineTo(col * scaleX, canvas.height);
    }
    for (let row = 0; row <= ROWS; row++) {
      context.moveTo(0, row * scaleY);
      context.lineTo(canvas.width, row * scaleY);
    }
    context.stroke();

    // Draw playfield
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (gameState.playfield[row][col]) {
          context.fillStyle = gameState.playfield[row][col] as string;
          context.fillRect(col * scaleX + 1, row * scaleY + 1, scaleX - 2, scaleY - 2);
        }
      }
    }

    // Draw active tetromino
    if (gameState.currentTetromino) {
      context.fillStyle = gameState.currentTetromino.color;
      gameState.currentTetromino.matrix.forEach((row: number[], r: number) => {
        row.forEach((value: number, c: number) => {
          if (value) {
            context.fillRect(
              (gameState.currentTetromino.col + c) * scaleX + 1,
              (gameState.currentTetromino.row + r) * scaleY + 1,
              scaleX - 2,
              scaleY - 2
            );
          }
        });
      });
    }
  });

  const loop = $(async () => {
    if (!isPlaying.value) return;

    gameState.requestId = requestAnimationFrame(() => loop());

    gameState.count++;

    if (gameState.count >= gameState.gameSpeed) {
      gameState.count = 0;

      const row = gameState.currentTetromino.row + 1;
      if (
        await isValidMove(
          gameState.currentTetromino.matrix,
          row,
          gameState.currentTetromino.col,
          gameState.playfield
        )
      ) {
        gameState.currentTetromino.row = row;
      } else {
        await placeTetromino();
      }
    }

    await draw();
  });

  const handleLeft = $(async () => {
    const col = gameState.currentTetromino.col - 1;
    if (
      await isValidMove(
        gameState.currentTetromino.matrix,
        gameState.currentTetromino.row,
        col,
        gameState.playfield
      )
    ) {
      gameState.currentTetromino.col = col;
      SoundFX.move();
    }
  });

  const handleRight = $(async () => {
    const col = gameState.currentTetromino.col + 1;
    if (
      await isValidMove(
        gameState.currentTetromino.matrix,
        gameState.currentTetromino.row,
        col,
        gameState.playfield
      )
    ) {
      gameState.currentTetromino.col = col;
      SoundFX.move();
    }
  });

  const handleRotate = $(async () => {
    const matrix = await rotate(gameState.currentTetromino.matrix);
    if (
      await isValidMove(
        matrix,
        gameState.currentTetromino.row,
        gameState.currentTetromino.col,
        gameState.playfield
      )
    ) {
      gameState.currentTetromino.matrix = matrix;
      SoundFX.rotate();
    }
  });

  const handleDrop = $(async () => {
    const row = gameState.currentTetromino.row + 1;
    if (
      await isValidMove(
        gameState.currentTetromino.matrix,
        row,
        gameState.currentTetromino.col,
        gameState.playfield
      )
    ) {
      gameState.currentTetromino.row = row;
    }
  });

  const startGame = $(async () => {
    SoundFX.init();
    gameState.playfield = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    gameState.tetrominoSequence = [];
    gameState.count = 0;

    gameState.nextTetromino = await getNextTetromino();
    gameState.currentTetromino = await getNextTetromino();
    await drawNextPiece();

    if (gameState.currentTetromino.techData) {
      const t = gameState.currentTetromino.techData;
      const imgPath = t.image.startsWith('http') ? t.image : `/media/${t.image}`;

      currentTechInfo.name = t.name;
      currentTechInfo.kanji = t.kanji || '';
      currentTechInfo.image = imgPath;
      imageError.value = false;
    }

    score.ippon = 0;
    score.waza = 0;
    score.yuko = 0;
    level.value = 1;
    isGameOver.value = false;
    isPlaying.value = true;
  });

  // Game loop effect
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => isPlaying.value);

    if (isPlaying.value) {
      gameState.requestId = requestAnimationFrame((t) => loop(t));
    }

    cleanup(() => {
      if (gameState.requestId) {
        cancelAnimationFrame(gameState.requestId);
      }
    });
  });

  // Keyboard controls
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track, cleanup }) => {
    track(() => isPlaying.value);
    track(() => isGameOver.value);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying.value || isGameOver.value) return;
      if (e.key === 'ArrowLeft') handleLeft();
      else if (e.key === 'ArrowRight') handleRight();
      else if (e.key === 'ArrowUp') handleRotate();
      else if (e.key === 'ArrowDown') handleDrop();
    };

    window.addEventListener('keydown', handleKeyDown);
    cleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  const Joystick = component$<{
    onLeft: QRL<() => void>;
    onRight: QRL<() => void>;
    onUp?: QRL<() => void>;
    onDown?: QRL<() => void>;
    label: string;
  }>(({ onLeft, onRight, onUp, onDown, label }) => {
    return (
      <div class="flex gap-2 select-none touch-none scale-90 sm:scale-100">
        <div class="bg-gray-800/60 rounded-full w-28 h-28 relative backdrop-blur border border-white/20">
          {onUp && (
            <button
              class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
              onTouchStart$={(e) => {
                e.preventDefault();
                onUp();
              }}
              onClick$={onUp}
            >
              ▲
            </button>
          )}
          {onDown && (
            <button
              class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
              onTouchStart$={(e) => {
                e.preventDefault();
                onDown();
              }}
              onClick$={onDown}
            >
              ▼
            </button>
          )}
          <button
            class="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
            onTouchStart$={(e) => {
              e.preventDefault();
              onLeft();
            }}
            onClick$={onLeft}
          >
            ◀
          </button>
          <button
            class="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center active:bg-white/20 rounded-full"
            onTouchStart$={(e) => {
              e.preventDefault();
              onRight();
            }}
            onClick$={onRight}
          >
            ▶
          </button>
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span class="text-white/40 text-[10px] font-bold tracking-tighter">{label}</span>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div class="fixed inset-0 z-[9999] bg-black text-white overflow-hidden font-sans">
      {/* Fullscreen Background Image */}
      <div class="absolute inset-0 z-0 flex items-center justify-center">
        <img
          src={imageError.value ? '/media/kano_non_sa.webp' : currentTechInfo.image || '/media/kano_non_sa.webp'}
          alt="Background"
          class="w-full h-full object-cover opacity-60 transition-opacity duration-1000"
          onError$={() => {
            if (currentTechInfo.image !== '/media/kano_non_sa.webp') {
              currentTechInfo.image = '/media/kano_non_sa.webp';
              imageError.value = true;
            }
          }}
        />
        <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Close Button Header */}
      <div class="absolute top-0 left-0 right-0 z-[100] p-4 flex justify-between items-start pointer-events-none">
        <div class="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/10 pointer-events-auto">
          <h2 class="text-xl font-black italic tracking-tighter text-blue-500">
            Gokyo<span class="text-white">-Tris</span>
          </h2>
        </div>

        <button
          onClick$={() => nav('/')}
          class="w-12 h-12 flex items-center justify-center bg-red-600/90 hover:bg-red-500 rounded-full border-2 border-white/20 shadow-lg transition-all active:scale-90 pointer-events-auto"
          aria-label="Close"
        >
          <span class="text-2xl font-bold">✕</span>
        </button>
      </div>

      {/* Content Area */}
      <div class="relative z-10 w-full h-full flex flex-col items-center justify-between py-20 px-4">
        {/* HUD */}
        <div class="w-full max-w-sm grid grid-cols-3 gap-2 bg-black/50 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
          <div class="flex flex-col justify-center gap-1 font-mono text-[10px]">
            <div class="flex justify-between border-b border-red-500/30">
              <span class="text-gray-400">IPPON</span>
              <span class="text-red-500 font-bold">{score.ippon}</span>
            </div>
            <div class="flex justify-between border-b border-yellow-500/30">
              <span class="text-gray-400">WAZA</span>
              <span class="text-yellow-500 font-bold">{score.waza}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">YUKO</span>
              <span class="text-blue-500 font-bold">{score.yuko}</span>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center text-center">
            <div class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tecnica</div>
            <div class="mt-1 font-bold text-xs line-clamp-2 leading-tight h-8 flex items-center">
              {currentTechInfo.name || '---'}
            </div>
            <div class="text-lg text-red-500 font-serif leading-none mt-1">
              {currentTechInfo.kanji}
            </div>
          </div>

          <div class="flex flex-col items-center justify-center border-l border-white/10 pl-2">
            <div class="text-[10px] text-gray-400 mb-1 font-bold">NEXT</div>
            <canvas
              ref={nextCanvasRef}
              width={45}
              height={45}
              class="bg-black/20 rounded"
            />
          </div>
        </div>

        {/* Game Canvas Container */}
        <div class="flex-grow flex items-center justify-center w-full my-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={320}
            height={640}
            class="h-full rounded-lg border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] aspect-[1/2]"
          />
        </div>

        {/* Bottom Controls */}
        <div class="w-full max-w-md flex justify-around items-center px-4">
          <Joystick
            label="MUOVI"
            onLeft={handleLeft}
            onRight={handleRight}
            onDown={handleDrop}
          />

          <div class="flex flex-col gap-2">
            <button
              onClick$={handleRotate}
              class="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)] border-4 border-white/20 active:scale-95 transition-transform flex items-center justify-center"
            >
              <span class="text-4xl font-bold select-none">↻</span>
            </button>
            <span class="text-[10px] text-center font-bold text-gray-500 uppercase tracking-widest">
              Ruota
            </span>
          </div>
        </div>
      </div>

      {/* Welcome / Game Over Overlays */}
      {(!isPlaying.value || isGameOver.value) && (
        <div class="absolute inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
          <div class="mb-10">
            <h1 class="text-6xl font-black italic tracking-tighter leading-none mb-2">
              GOKYO
              <br />
              <span class="text-red-600">-TRIS</span>
            </h1>
            <p class="text-gray-500 font-medium tracking-widest uppercase text-xs">
              Judo Mastery Game
            </p>
          </div>

          {isGameOver.value && (
            <div class="mb-12 animate-in fade-in zoom-in duration-500">
              <div class="text-red-600 font-black text-4xl mb-4 italic">IPPON!</div>
              <div class="bg-white/5 rounded-3xl p-6 border border-white/10 max-w-xs mx-auto">
                <p class="text-gray-400 text-sm mb-3 font-bold uppercase tracking-widest">
                  Risultato Finale
                </p>
                <div class="grid grid-cols-3 gap-4">
                  <div class="flex flex-col">
                    <span class="text-2xl font-black text-red-500">{score.ippon}</span>
                    <span class="text-[10px] text-gray-500 font-bold">IPPON</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-2xl font-black text-yellow-500">{score.waza}</span>
                    <span class="text-[10px] text-gray-500 font-bold">WAZA</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-2xl font-black text-blue-500">{score.yuko}</span>
                    <span class="text-[10px] text-gray-500 font-bold">YUKO</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick$={startGame}
            class="group relative px-12 py-5 overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95"
          >
            <div class="absolute inset-0 bg-red-600 transition-colors group-hover:bg-red-500" />
            <span class="relative text-2xl font-black tracking-tight text-white uppercase italic">
              {isGameOver.value ? 'Riprova' : 'Inizia Ora'}
            </span>
          </button>

          <div class="mt-12 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
            Tastiera: FRECCE | Touch: JOYSTICK
          </div>
        </div>
      )}

      {/* Fullscreen Style Injection */}
      <style
        dangerouslySetInnerHTML={`
          body { overflow: hidden; overscroll-behavior: none; }
          * { -webkit-tap-highlight-color: transparent; }
        `}
      />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Gokyo-Tris - JudoOK',
  meta: [
    {
      name: 'description',
      content: 'Tetris con le tecniche del Judo. Gioca e impara il Gokyo!',
    },
  ],
};
