import React, { useEffect, useState } from 'react';
import './App.css';

const GRID_WIDTH = 30;
const GRID_HEIGHT = 30;

const cells = new Array(GRID_HEIGHT * GRID_WIDTH).fill(undefined).map((val, idx) => idx);

type Direction = 'up' | 'down' | 'left' | 'right';

const moveHead = (position: number, direction: Direction) => {
  const trueX = position % GRID_WIDTH;
  
  const steps = {
    'up': -GRID_WIDTH,
    'down': GRID_WIDTH,
    'left': -1,
    'right': 1,
  };

  const newPosition = position + steps[direction];

  if (direction === 'left' && trueX === 0) {
    return position + GRID_WIDTH - 1;
  }
  if (direction === 'right' && trueX === GRID_WIDTH - 1) {
    return position - GRID_WIDTH + 1;
  }
  if (newPosition === cells.length + GRID_WIDTH) {
    return 0;
  }
  if (newPosition < 0) {
    return cells.length + newPosition;
  }
  if (newPosition > cells.length) {
    return newPosition - cells.length;
  }
  
  return newPosition;
}

const randomFood = (snake: number[]) => {
  const nonSnakeCells = cells.filter(item => !snake.includes(item));
  const randomIndex = Math.floor(Math.random() * nonSnakeCells.length);
  return nonSnakeCells[randomIndex];
}

const snakeHead = (cells.length / 2) + (GRID_WIDTH / 2);
const initialSnake = [snakeHead - 4, snakeHead - 3, snakeHead - 2, snakeHead - 1, snakeHead];

const App = () => {
  const [touch, setTouch] = useState<[number, number] | undefined>();
  const [paused, setPaused] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [tick, setTick] = useState(0);
  const [snake, setSnake] = useState<number[]>(initialSnake);
  const [direction, setDirection] = useState<Direction>('right');
  const [food, setFood] = useState(randomFood(snake));
  const score = snake.length - initialSnake.length;
  const speed = 100 - (score < 90 ? snake.length : 90);

  useEffect(() => {
    if (paused) {
      return;
    }
    const [tail, ...body] = snake;
    const head = snake[snake.length - 1];
    const newHead = moveHead(head, direction);
    if (snake.includes(newHead)) {
      setGameOver(true);
      return;
    }
    if (newHead === food) {
      const newSnake = [...snake, newHead];
      setSnake(newSnake);
      setFood(randomFood(newSnake));
    } else {
      setSnake([...body, newHead]);
    }
    setTimeout(() => setTick(tick + 1), speed);
  }, [tick, paused]);

  const restartGame = () => {
    setTick(0);
    setGameOver(false);
    setSnake(initialSnake);
    setFood(randomFood(initialSnake));
    setDirection('right');
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.code === 'KeyP') {
      setPaused(true);
      return;
    }

    const keyMap: { [key: string]: Direction } = {
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'ArrowDown': 'down',
      'ArrowUp': 'up',
      'KeyA': 'left',
      'KeyD': 'right',
      'KeyS': 'down',
      'KeyW': 'up',
    };
    const newDirection = keyMap[event.code];
    if (!newDirection) {
      return;
    }

    const nextHead = moveHead(snake[snake.length - 1], newDirection);
    if (snake.length > 1 && nextHead === snake[snake.length - 2]) {
      // Don't allow the player to turn back on themselves
      return;
    }
    setDirection(newDirection);
  }

  const getAdjacentClass = (val: number, next: boolean) => {
    const idx = snake.indexOf(val);
    if(next ? (snake.length - 1 === idx || idx === -1) : (idx === 0 || idx === -1)) {
      return '';
    }
    const previous = snake[idx + (next ? 1 : -1)];
    if (val - previous === -1 || val - previous === GRID_WIDTH - 1) {
      return 'right';
    }
    if (val - previous === 1 || val - previous === -GRID_WIDTH + 1) {
      return 'left';
    }
    if (val - previous === -GRID_WIDTH || val - previous === cells.length - GRID_WIDTH) {
      return 'down';
    }
    if (val - previous === GRID_WIDTH || val - previous === -cells.length + GRID_WIDTH) {
      return 'up';
    }
    return '';
  }
  return (
    <div
      id="page-container"
      onTouchStart={(evt) => {
        if (evt.touches.length !== 1) {
          setTouch(undefined);
          return;
        }
        const { screenX, screenY } = evt.touches[0];
        setTouch([screenX, screenY]);
      }}
      onTouchEnd={(evt) => {
        if (evt.changedTouches.length !== 1 || !touch) {
          return;
        }
        const [touchX, touchY] = touch;
        const { screenX, screenY } = evt.changedTouches[0];
        let newDirection: Direction;
        if (Math.abs(screenX - touchX) > Math.abs(screenY - touchY)) {
          if (screenX - touchX > 0) {
            newDirection = 'right';
          } else {
            newDirection = 'left';
          }
        } else {
          if (screenY - touchY > 0) {
            newDirection = 'down';
          } else {
            newDirection = 'up';
          }
        }

        const nextHead = moveHead(snake[snake.length - 1], newDirection);
        if (snake.length > 1 && nextHead === snake[snake.length - 2]) {
          // Don't allow the player to turn back on themselves
          return;
        }
        setDirection(newDirection);
      }}
    >
      <div
        id="grid-container"
        tabIndex={0}
        onKeyDown={handleKeyPress}
        onBlur={() => setPaused(true)}
        onFocus={() => setPaused(false)}
      >
        {
          cells.map((val, idx, rest) => (
            <div
              key={val}
              className={`
                cell
                ${snake.includes(idx) ? 'snake' : ''}
                ${food === idx ? 'food' : ''}
                ${getAdjacentClass(val, true)}
                ${getAdjacentClass(val, false)}
              `}
              style={{
                height: `${100 / GRID_HEIGHT}%`,
                width: `${100 / GRID_WIDTH}%`,
              }}
            />
          ))
        }
        <div id="score">
          <div>Current score: {score}</div>
          { !paused && !gameOver && <div>Press P to pause</div> }
        </div>
        <div id="overlay">
          {
            gameOver && !paused && (
              <div>
                <div>Game over</div>
                <div onClick={restartGame}>Click here to restart</div>
              </div>
            )
          }
          {
            !gameOver && paused && (
              <div>
                <div>Game paused</div>
                <div onClick={() => setPaused(false)}>Click here to resume</div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default App;
