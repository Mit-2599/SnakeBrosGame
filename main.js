import {
  GRID_SIZE,
  createInitialState,
  enqueueDirection,
  step,
} from "./game.js";

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restart");
const pauseBtn = document.getElementById("pause");
const touchButtons = document.querySelectorAll(".dir");

const TICK_MS = 120;

let cellSize = 0;
let boardSize = 0;

let state = createInitialState();
let paused = false;
let lastTime = 0;
let accumulator = 0;

const MARIO_SPRITE = [
  "....RRRRRR......",
  "...RRRRRRRR.....",
  "..RRSSSRSSS.....",
  "..RSSSRSRSSS....",
  "..RSSSSRRSSS....",
  "...SSSRRRSS.....",
  "..BBBYYB........",
  ".BBBBYYBB.......",
  ".BBBBYYYYB......",
  "..BBYYYYBB......",
  "..RRRBBBBR......",
  ".RRRRBBBBRR.....",
  "RRRRBBBBBBRR....",
  "R..BBB..BBB.....",
  "...BBB..BBB.....",
  "..BBBB..BBBB....",
];

const MARIO_PALETTE = {
  R: "#d13b3b",
  S: "#f2c9a0",
  Y: "#f1c84b",
  B: "#2e59c4",
};

function drawMarioFood(x, y, size) {
  const px = size / MARIO_SPRITE[0].length;
  const offset = (cellSize - size) / 2;
  MARIO_SPRITE.forEach((row, rowIndex) => {
    for (let col = 0; col < row.length; col += 1) {
      const code = row[col];
      const color = MARIO_PALETTE[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        x + offset + col * px,
        y + offset + rowIndex * px,
        px,
        px
      );
    }
  });
}

function setOverlay(message) {
  if (!message) {
    overlay.textContent = "";
    overlay.classList.remove("show");
    return;
  }
  overlay.textContent = message;
  overlay.classList.add("show");
}

function drawGrid() {
  ctx.fillStyle = "#151820";
  ctx.fillRect(0, 0, boardSize, boardSize);
  ctx.strokeStyle = "#242a36";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, boardSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(boardSize, pos);
    ctx.stroke();
  }
}

function draw() {
  drawGrid();
  if (state.food) {
    const x = state.food.x * cellSize;
    const y = state.food.y * cellSize;
    drawMarioFood(x, y, cellSize * 0.9);
  }
  ctx.fillStyle = "#6bd17b";
  state.snake.forEach((segment, index) => {
    const inset = index === 0 ? 1 : 3;
    ctx.fillRect(
      segment.x * cellSize + inset,
      segment.y * cellSize + inset,
      cellSize - inset * 2,
      cellSize - inset * 2
    );
  });
  scoreEl.textContent = `Score: ${state.score}`;
}

function tick() {
  if (paused || !state.alive) return;
  state = step(state);
  if (!state.alive) {
    setOverlay("Game Over");
  }
  draw();
}

function reset() {
  state = createInitialState();
  paused = false;
  pauseBtn.textContent = "Pause";
  setOverlay("");
  draw();
}

function togglePause() {
  if (!state.alive) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  setOverlay(paused ? "Paused" : "");
}

function handleDirection(dir) {
  state = enqueueDirection(state, dir);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  boardSize = Math.floor(rect.width);
  const scaled = Math.floor(boardSize * dpr);
  if (canvas.width !== scaled || canvas.height !== scaled) {
    canvas.width = scaled;
    canvas.height = scaled;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  cellSize = boardSize / GRID_SIZE;
  draw();
}

function startLoop() {
  const loop = (time) => {
    if (!lastTime) lastTime = time;
    const delta = time - lastTime;
    lastTime = time;
    accumulator += delta;
    while (accumulator >= TICK_MS) {
      tick();
      accumulator -= TICK_MS;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "w"].includes(key)) handleDirection("up");
  if (["arrowdown", "s"].includes(key)) handleDirection("down");
  if (["arrowleft", "a"].includes(key)) handleDirection("left");
  if (["arrowright", "d"].includes(key)) handleDirection("right");
  if (key === " ") togglePause();
  if (key === "enter" && !state.alive) reset();
});

restartBtn.addEventListener("click", reset);
pauseBtn.addEventListener("click", togglePause);
touchButtons.forEach((btn) => {
  btn.addEventListener("click", () => handleDirection(btn.dataset.dir));
});

let pointerStart = null;
const SWIPE_THRESHOLD = 18;

function onPointerDown(event) {
  pointerStart = { x: event.clientX, y: event.clientY, moved: false };
  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event) {
  if (!pointerStart || pointerStart.moved) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
  pointerStart.moved = true;
  if (Math.abs(dx) > Math.abs(dy)) {
    handleDirection(dx > 0 ? "right" : "left");
  } else {
    handleDirection(dy > 0 ? "down" : "up");
  }
}

function onPointerUp(event) {
  if (pointerStart) {
    canvas.releasePointerCapture(event.pointerId);
  }
  pointerStart = null;
}

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointercancel", onPointerUp);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    paused = true;
    pauseBtn.textContent = "Resume";
    setOverlay("Paused");
  }
});

reset();
resizeCanvas();
startLoop();
