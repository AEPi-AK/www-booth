import Express = require('express');
import Http = require('http');
import IO = require('socket.io');
import { GameState, GamePhase, Color, Puzzle, TileType } from '../../shared/GameTypes';
import { colors, combos, normalize, tilePositions } from '../../shared/Data';
var shuffle = require('shuffle-array');


type Position = [number, number];

var app = Express();
var http = new Http.Server(app);
var io = IO(http, { 'pingInterval': 2000, 'pingTimeout': 5000 });
var clients: string[] = new Array<string>();

http.listen(3000, function () {
  console.log('listening on *:3000');
});

function startingGameState(): GameState {
  return {
    phase: GamePhase.Idle,
    time: 120,
    puzzles: [null, null, null],
    solves: [0, 0, 0]
  };
}

var game_state: GameState = startingGameState();
function resetGameState() {
  game_state = startingGameState();
}

function updatedGameState() {
  io.sockets.emit('game-state-updated', game_state);
}

function random(max: number) {
  return Math.floor(Math.random() * max);
}

function generatePuzzle(solves: number) {
  let difficulty = Math.min(solves, 4);
  let recipe = combos[difficulty][random(combos[difficulty].length)];
  let ingredients = recipe.ingredients[random(recipe.ingredients.length)];

  // ingredient colors (indexes)
  // ensures no two pieces of the same puzzle are the same color
  let ingredientColors = colors.slice();
  shuffle(ingredientColors);

  let tiles = [];
  for (let i = 0; i < ingredients.length; i++) {
    tiles[i] = {
      type: ingredients[i],
      color: ingredientColors[i]
    };
  }

  return {
    id: recipe.id,
    grid: normalize(recipe.grid, 4, 4),
    ingredients: tiles
  }
}

function compare2d(a: Position, b: Position) {
  if (a[0] > b[0]) {
    return 1;
  } else if (a[0] < b[0]) {
    return -1;
  } else if (a[1] > b[1]) {
    return 1;
  } else if (a[1] < b[1]) {
    return -1;
  } else {
    return 0;
  }
}

function matchInRotation(prototype: Position[], actual: Position[]) {
  if (prototype.length !== actual.length) {
    return false;
  }
  prototype = prototype.slice();
  actual = actual.slice();
  prototype.sort(compare2d);
  actual.sort(compare2d);

  let minXProto = prototype[0][0];
  let minYProto = prototype[0][1];
  let minXActual = actual[0][0];
  let minYActual = actual[0][1];

  for (let i = 0; i < prototype.length; i++) {
    if (prototype[i][0] - minXProto !== actual[i][0] - minXActual) {
      return false;
    }
    if (prototype[i][1] - minYProto !== actual[i][1] - minYActual) {
      return false;
    }
    console.log("matched (" + prototype[i][0] + ", " + prototype[i][1] + ") with (" + actual[i][0] + ", " + actual[i][1] + ")")
  }
  return true;
}


//@ts-ignore
let orientations: ((ls: Position[]) => Position[])[] = [
  ls => ls,
  ls => ls.map(a => [-a[1], a[0]]),
  ls => ls.map(a => [-a[0], -a[1]]),
  ls => ls.map(a => [a[1], -a[0]]),
  ls => ls.map(a => [-a[0], a[1]]),
  ls => ls.map(a => [-a[1], -a[0]]),
  ls => ls.map(a => [a[0], -a[1]]),
  ls => ls.map(a => [a[1], a[0]]),
]

function match(prototype: Position[], actual: Position[]) {
  for (let i = 0; i < orientations.length; i++) {
    console.log("trying orientation " + i);
    if (matchInRotation(orientations[i](prototype), orientations[i](actual))) {
      console.log("matched in orientation " + i)
      return true;
    }
  }
  return false;
}

function puzzleSolutionCheck(puz: Puzzle, grid: (Color | null)[][]) {
  //@ts-ignore
  if (puz.ingredients.length * 4 != Array.prototype.concat.apply([], grid).filter(c => c !== null).length) {
    return false;
  }

  for (let tile of puz.ingredients) {
    let positions: Position[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === tile.color) {
          positions.push([i, j]);
        }
      }
    }
    if (!match(tilePositions(tile.type), positions)) {
      return false;
    }
  }
  return true;
}

let psc_tests: { puz: Puzzle, grid: (Color | null)[][], result: boolean }[] = [
  {
    puz: {
      id: 1,
      ingredients: [{ color: Color.Red, type: TileType.L }],
      grid: [
        [1, 1],
        [1, 0],
        [1, 0]
      ]
    },
    grid: [
      [null, Color.Red, Color.Red, null],
      [null, null, Color.Red, null],
      [null, Color.Red, null, null],
      [null, null, null, null]
    ],
    result: true
  },
  {
    puz: {
      id: 1,
      ingredients: [{ color: Color.Red, type: TileType.L }],
      grid: [
        [1, 1],
        [1, 0],
        [1, 0]
      ]
    },
    grid: [
      [null, null, Color.Red, null],
      [null, Color.Red, Color.Red, null],
      [null, null, Color.Red, null],
      [null, null, null, null]
    ],
    result: false
  },
  {
    puz: {
      id: 1,
      ingredients: [{ color: Color.Red, type: TileType.L }],
      grid: [
        [1, 1],
        [1, 0],
        [1, 0]
      ]
    },
    grid: [
      [null, null, Color.Red, null],
      [null, null, Color.Red, null],
      [null, null, Color.Red, null],
      [null, null, null, null]
    ],
    result: false
  },
  {
    puz: {
      id: 14,
      ingredients: [{ color: Color.Red, type: TileType.L }, { color: Color.Green, type: TileType.O }, { color: Color.Blue, type: TileType.T }],
      grid: [
        [0, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 0]
      ]
    },
    grid: [
      [null, null, null, Color.Blue],
      [Color.Green, Color.Green, Color.Blue, Color.Blue],
      [Color.Green, Color.Red, Color.Red, Color.Blue],
      [Color.Green, Color.Red, Color.Red, null]
    ],
    result: true,
  },
  {
    puz: {
      id: 14,
      ingredients: [{ color: Color.Red, type: TileType.L }, { color: Color.Green, type: TileType.O }, { color: Color.Blue, type: TileType.T }],
      grid: [
        [0, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 0]
      ]
    },
    grid: [
      [null, null, null, Color.Red],
      [Color.Green, Color.Blue, Color.Blue, Color.Blue],
      [Color.Green, Color.Red, Color.Green, Color.Blue],
      [Color.Green, Color.Red, Color.Red, null]
    ],
    result: false,
  },
]

for (let i = 0; i < psc_tests.length; i++) {
  let { puz, grid, result } = psc_tests[i];
  if (puzzleSolutionCheck(puz, grid) !== result) {
    throw "failed " + i;
  } else {
    console.log("passed " + i);
  }
}


function startIdle() {
  clearTimers();
  game_state.phase = GamePhase.Idle;
  updatedGameState();
}

function addPuzzleCallback(index: number) {
  return () => {
    game_state.puzzles[index] = generatePuzzle(game_state.solves[index]);
    updatedGameState();
  }
}

var pregameTimers: NodeJS.Timer[] = [];
function startPreGame() {
  clearTimers();

  game_state = {
    phase: GamePhase.PreGame,
    time: 5,
    puzzles: [null, null, null],
    solves: [0, 0, 0]
  };

  function tick() {
    game_state.time -= 1;
    if (game_state.time === 0) {
      startGame();
    }
    updatedGameState();
  }

  game_state.phase = GamePhase.PreGame;
  pregameTimers.push(setInterval(tick, 1000));
  updatedGameState();
}

var playingTimers: NodeJS.Timer[] = [];
function startGame() {
  clearTimers();
  function tick() {
    game_state.time -= 1;
    if (game_state.time === 0) {
      startPostgame();
    }
    updatedGameState();
  }

  game_state = {
    phase: GamePhase.Playing,
    time: 120,
    puzzles: [generatePuzzle(0), generatePuzzle(0), generatePuzzle(0)],
    solves: [0, 0, 0]
  };
  playingTimers.push(setInterval(tick, 1000));

  updatedGameState();
}

var postgameTimers: NodeJS.Timer[] = [];
function startPostgame() {
  clearTimers();
  game_state = {
    phase: GamePhase.PostGame,
    time: 0,
    puzzles: [null, null, null],
    solves: game_state.solves
  };

  postgameTimers.push(setTimeout(startIdle, 3000));
  updatedGameState();
}

function clearTimers() {
  for (let timer of pregameTimers) {
    clearTimeout(timer);
  }
  for (let timer of playingTimers) {
    clearTimeout(timer);
  }
  for (let timer of postgameTimers) {
    clearTimeout(timer);
  }
}


io.on('connect', function (socket: SocketIO.Socket) {
  let name: null | string = null;
  console.log('a user connected: ' + socket.id);

  updatedGameState();

  socket.on('disconnect', function () {
    if (name) {
      console.log(name + ' disconnected');
      clients = clients.filter(e => e !== name);
      io.sockets.emit('clients-updated', clients);
    }
    else console.log(socket.id + ' disconnected');
  });

  socket.on('identification', function (data: string) {
    if (name === null) {
      console.log('user ' + socket.id + ' identified as ' + data);
      name = data;
      clients.push(name);
      io.sockets.emit('clients-updated', clients);
    }
  });

  socket.on('start-game', function () {
    console.log("game starting");
    if (game_state.phase == GamePhase.NotConnected) {
      // TODO: handle disconnected state
    }
    if (game_state.phase !== GamePhase.Idle) {
      return;
    }
    startPreGame();
  });

  socket.on('reset-game', startIdle);

  socket.on('submission', (message: { station: number, grid: (Color | null)[][] }) => {
    let { station, grid } = message;

    let puz = game_state.puzzles[station];

    if (puz !== null && puzzleSolutionCheck(puz, grid)) {
      socket.emit('solve-puzzle', station);
    } else {
      socket.emit('wrong-submission', station);
    }



  });

  socket.on('solved-puzzle', function (data: number) {
    if (game_state.phase != GamePhase.Playing) {
      return;
    }

    let solved = game_state.solves[data]++;

    game_state.puzzles[data] = null;
    playingTimers.push(
      setTimeout(addPuzzleCallback(data), 2000)
    );

    updatedGameState();
  });
});
