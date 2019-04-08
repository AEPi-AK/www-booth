import Express = require('express');
import Http = require('http');
import IO = require('socket.io');
import { GameState, GamePhase } from '../../shared/GameTypes';
import { colors, combos, normalize } from '../../shared/Data';
var shuffle = require('shuffle-array');

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



var playingTimers: NodeJS.Timer[] = [];
function returnToIdle() {
  if (game_state.phase === GamePhase.Playing) {
    for (let timer of playingTimers) {
      clearTimeout(timer);
    }
    game_state.phase = GamePhase.Idle;
  }
  updatedGameState();
}

function tick() {
  game_state.time -= 1;
  if (game_state.time === 0) {
    returnToIdle()
  }
  updatedGameState();
}

function addPuzzleCallback(index: number) {
  return () => {
    game_state.puzzles[index] = generatePuzzle(game_state.solves[index]);
    updatedGameState();
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
    if (game_state.phase == GamePhase.Playing) {
      return;
    }

    game_state = startingGameState();
    game_state.phase = GamePhase.Playing;
    for (let i = 0; i < 3; i++) {
      game_state.puzzles[i] = generatePuzzle(0);
    }

    playingTimers.push(setInterval(tick, 1000));

    updatedGameState();
  });

  socket.on('reset-game', returnToIdle);

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