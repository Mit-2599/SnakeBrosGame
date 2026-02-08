const GRID_SIZE = 20;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function pickEmptyCell(occupiedSet, rng) {
  const total = GRID_SIZE * GRID_SIZE;
  if (occupiedSet.size >= total) {
    return null;
  }
  let attempts = 0;
  while (attempts < 500) {
    const index = Math.floor(rng() * total);
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const key = `${x},${y}`;
    if (!occupiedSet.has(key)) {
      return { x, y };
    }
    attempts += 1;
  }
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const key = `${x},${y}`;
      if (!occupiedSet.has(key)) {
        return { x, y };
      }
    }
  }
  return null;
}

function createInitialState(rng = Math.random) {
  const snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const food = pickEmptyCell(occupied, rng);
  return {
    gridSize: GRID_SIZE,
    snake,
    direction: "right",
    nextDirection: "right",
    food,
    score: 0,
    alive: true,
  };
}

function isOpposite(a, b) {
  return OPPOSITE[a] === b;
}

function enqueueDirection(state, nextDir) {
  if (!DIRECTIONS[nextDir]) return state;
  if (isOpposite(state.direction, nextDir)) return state;
  return { ...state, nextDirection: nextDir };
}

function step(state, rng = Math.random) {
  if (!state.alive) return state;
  const direction = state.nextDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  if (
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize
  ) {
    return { ...state, alive: false, direction };
  }

  const occupied = new Set(state.snake.map((p) => `${p.x},${p.y}`));
  const willGrow =
    state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;

  if (!willGrow) {
    const tail = state.snake[state.snake.length - 1];
    occupied.delete(`${tail.x},${tail.y}`);
  }

  if (occupied.has(`${nextHead.x},${nextHead.y}`)) {
    return { ...state, alive: false, direction };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willGrow) {
    nextSnake.pop();
  }

  const nextOccupied = new Set(nextSnake.map((p) => `${p.x},${p.y}`));
  const nextFood = willGrow ? pickEmptyCell(nextOccupied, rng) : state.food;

  return {
    ...state,
    snake: nextSnake,
    direction,
    food: nextFood,
    score: willGrow ? state.score + 1 : state.score,
  };
}

export {
  GRID_SIZE,
  createRng,
  createInitialState,
  enqueueDirection,
  step,
};
