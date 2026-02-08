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

const CELL = canvas.width / GRID_SIZE;
const TICK_MS = 120;

let state = createInitialState();
let paused = false;
let timer = null;

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
  const offset = (CELL - size) / 2;
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
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#242a36";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * CELL;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function draw() {
  drawGrid();
  if (state.food) {
    const x = state.food.x * CELL;
    const y = state.food.y * CELL;
    drawMarioFood(x, y, CELL * 0.9);
  }
  ctx.fillStyle = "#6bd17b";
  state.snake.forEach((segment, index) => {
    const inset = index === 0 ? 1 : 3;
    ctx.fillRect(
      segment.x * CELL + inset,
      segment.y * CELL + inset,
      CELL - inset * 2,
      CELL - inset * 2
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

function startLoop() {
  if (timer) clearInterval(timer);
  timer = setInterval(tick, TICK_MS);
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

reset();
startLoop();
