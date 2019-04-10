import Express = require('express');
import Http = require('http');
import IO = require('socket.io');
import fs = require('fs');
import { GameState, GamePhase, Color, Puzzle, TileType, HardwareState, Tile } from '../../shared/GameTypes';
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

var game_state: GameState = {
  phase: GamePhase.Idle,
  time: 120,
  puzzles: [null, null, null],
  solves: [0, 0, 0],
  highScoreState: {
    highScore: 0,
    newHighScore: false,
  }
};

var hardware_state: HardwareState = {
  disabledTiles: []
}

fs.readFile("high-score.txt", (err, data) => {
  if (err) {
    if (err.code === "ENOENT") {
      fs.writeFileSync("high-score.txt", "0");
    } else {
      throw err;
    }
  } else {
    game_state.highScoreState.highScore = parseInt(data.toString());
  }
})

function updatedHardwareState() {
  io.sockets.emit('hardware-state-updated', hardware_state);
}

function tileDisabled(tile: Tile) {
  for (let t of hardware_state.disabledTiles) {
    if (t.color === tile.color && t.type === tile.type) {
      return true;
    }
  }
  return false;
}

function updatedGameState() {
  io.sockets.emit('game-state-updated', game_state);
}

function checkNewHighScore(score: number) {
  if (game_state.highScoreState.highScore >= score) {
    return;
  }
  game_state.highScoreState.newHighScore = true;
  game_state.highScoreState.highScore = score;
  fs.writeFile("high-score.txt", score.toString(), err => { });
}

function random(max: number) {
  return Math.floor(Math.random() * max);
}

function generatePuzzle(solves: number) {
  for (let i = 0; i < 1000; i++) {
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

    let ok = true;
    for (let tile of tiles) {
      if (tileDisabled(tile)) {
        ok = false;
      }
    }

    if (ok) {
      return {
        id: recipe.id,
        grid: normalize(recipe.grid, 4, 4),
        ingredients: tiles,
        solved: false
      }
    }
  }
  return {
    id: 0,
    grid: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    ingredients: [],
    solved: false
  }
}

// compare in lexicographic order
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

// matches prototype to actual, not trying different rotations but offsetting
function matchInRotation(prototype: Position[], actual: Position[]) {
  if (prototype.length !== actual.length) {
    return false;
  }
  prototype = prototype.slice();
  actual = actual.slice();
  prototype.sort(compare2d);
  actual.sort(compare2d);

  // get fixed reference points
  let minXProto = prototype[0][0];
  let minYProto = prototype[0][1];
  let minXActual = actual[0][0];
  let minYActual = actual[0][1];

  for (let i = 0; i < prototype.length; i++) {
    if (prototype[i][0] - minXProto !== actual[i][0] - minXActual || prototype[i][1] - minYProto !== actual[i][1] - minYActual) {
      return false;
    }
  }
  return true;
}

// possible orientations of tiles
//@ts-ignore
let orientations: ((ls: Position[]) => Position[])[] = [
  ls => ls, // id
  ls => ls.map(a => [-a[1], a[0]]), // 90 deg rotation
  ls => ls.map(a => [-a[0], -a[1]]), // 180 deg rotation
  ls => ls.map(a => [a[1], -a[0]]), // 270 deg rotation
  ls => ls.map(a => [-a[0], a[1]]), // flip over y-axis
  ls => ls.map(a => [-a[1], -a[0]]), // flip over y=-x
  ls => ls.map(a => [a[0], -a[1]]), // flip over x-axis
  ls => ls.map(a => [a[1], a[0]]), // flip over y=x
]

// matches prototype to actual up to rotation
function match(prototype: Position[], actual: Position[]) {
  for (let i = 0; i < orientations.length; i++) {
    if (matchInRotation(prototype, orientations[i](actual))) {
      return true;
    }
  }
  return false;
}

// returns true iff grid solves puz
function puzzleSolutionCheck(puz: Puzzle, grid: (Color | null)[][]) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (puz.grid[i][j] === 1 && grid[i][j] === null) {
        return false;
      } else if (puz.grid[i][j] === 0 && grid[i][j] !== null) {
        return false;
      }
    }
  }

  for (let tile of puz.ingredients) {
    let positions: Position[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === tile.color) {
          positions.push([j, i]);
        }
      }
    }
    if (!match(tilePositions(tile.type), positions)) {
      return false;
    }
  }
  return true;
}

function test_psc() {
  let psc_tests: { puz: Puzzle, grid: (Color | null)[][], result: boolean }[] = [
    { // 0
      puz: {
        id: 1,
        ingredients: [{ color: Color.Red, type: TileType.L }],
        grid: [
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [1, 0, 0, 0],
          [1, 0, 0, 0]
        ],
        solved: false
      },
      grid: [
        [null, null, null, null],
        [Color.Red, Color.Red, null, null],
        [Color.Red, null, null, null],
        [Color.Red, null, null, null]
      ],
      result: true
    },
    { // 1
      puz: {
        id: 1,
        ingredients: [{ color: Color.Red, type: TileType.L }],
        grid: [
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [1, 0, 0, 0],
          [1, 0, 0, 0]
        ],
        solved: false
      },
      grid: [
        [null, null, Color.Red, null],
        [null, Color.Red, Color.Red, null],
        [null, null, Color.Red, null],
        [null, null, null, null]
      ],
      result: false
    },
    { // 2
      puz: {
        id: 1,
        ingredients: [{ color: Color.Red, type: TileType.L }],
        grid: [
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [1, 0, 0, 0],
          [1, 0, 0, 0]
        ],
        solved: false
      },
      grid: [
        [null, null, null, null],
        [Color.Red, Color.Red, null, null],
        [Color.Red, null, null, null],
        [Color.Green, null, null, null]
      ],
      result: false
    },
    {
      puz: {
        id: 0,
        ingredients: [{ color: Color.Red, type: TileType.L }, { color: Color.Green, type: TileType.O }],
        grid: [
          [0, 0, 0, 0],
          [0, 1, 1, 1],
          [0, 1, 1, 1],
          [0, 0, 1, 1]
        ],
        solved: false
      },
      grid: [
        [null, null, null, null],
        [null, Color.Green, Color.Green, Color.Red],
        [null, Color.Green, Color.Green, Color.Red],
        [null, null, Color.Red, Color.Red]
      ],
      result: true
    },
    { // 4
      puz: {
        id: 14,
        ingredients: [{ color: Color.Red, type: TileType.O }, { color: Color.Green, type: TileType.L }, { color: Color.Blue, type: TileType.T }],
        grid: [
          [0, 0, 0, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 1],
          [1, 1, 1, 0]
        ],
        solved: false
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
        ],
        solved: false
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
      console.log("passed " + i + "\n");
    }
  }
}
// test_psc();


function startIdle() {
  clearTimers();
  game_state = {
    phase: GamePhase.Idle,
    time: 0,
    puzzles: [null, null, null],
    solves: game_state.solves,
    highScoreState: {
      highScore: game_state.highScoreState.highScore,
      newHighScore: game_state.highScoreState.newHighScore
    }
  }
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
    phase: GamePhase.Idle,
    time: 5,
    puzzles: [null, null, null],
    solves: [0, 0, 0],
    highScoreState: {
      highScore: game_state.highScoreState.highScore,
      newHighScore: false
    }
  }

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
    checkNewHighScore(game_state.solves[0] + game_state.solves[1] + game_state.solves[2]);
    updatedGameState();
  }

  game_state = {
    phase: GamePhase.Playing,
    time: 120,
    puzzles: [generatePuzzle(0), generatePuzzle(0), generatePuzzle(0)],
    solves: [0, 0, 0],
    highScoreState: {
      highScore: game_state.highScoreState.highScore,
      newHighScore: false,
    }
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
    solves: game_state.solves,
    highScoreState: {
      highScore: game_state.highScoreState.highScore,
      newHighScore: game_state.highScoreState.newHighScore
    }
  };
  checkNewHighScore(game_state.solves[0] + game_state.solves[1] + game_state.solves[2]);

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
  updatedHardwareState();

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

    if (puz !== null && !puz.solved && puzzleSolutionCheck(puz, grid)) {
      socket.emit('solved-puzzle', station);
    } else {
      socket.emit('wrong-submission', station);
    }
  });

  socket.on('solved-puzzle', function (data: number) {
    if (game_state.phase != GamePhase.Playing) {
      return;
    }

    game_state.solves[data]++;

    game_state.puzzles[data]!.solved = true;
    playingTimers.push(
      setTimeout(addPuzzleCallback(data), 2000)
    );

    updatedGameState();
  });

  socket.on('enable-tile', function (data: { color: Color, type: TileType }) {
    let { color, type } = data;
    hardware_state.disabledTiles = hardware_state.disabledTiles.filter(
      tile => tile.color !== color || tile.type !== type
    );
    updatedHardwareState();
  });

  socket.on('disable-tile', function (data: { color: Color, type: TileType }) {
    let { color, type } = data;
    hardware_state.disabledTiles = hardware_state.disabledTiles.filter(
      tile => tile.color !== color || tile.type !== type
    );
    hardware_state.disabledTiles.push({ color, type });
    updatedHardwareState();
  })
});
