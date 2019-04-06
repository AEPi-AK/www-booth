import Express = require('express');
import Http = require('http');
import IO = require('socket.io');
import readline = require('readline');
import { GameState, GamePhase, Puzzle } from '../../shared/GameTypes';
import { colors, combos, normalize } from '../../shared/Data';
import { isNumber } from 'util';
import { Socket } from 'dgram';

var app = Express();
var http = new Http.Server(app);
var io = IO(http, {'pingInterval': 2000, 'pingTimeout': 5000});
var clients: string[] = new Array<string>();

http.listen(3000, function(){
  console.log('listening on *:3000');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function stationOnline(label: string) {
  return clients.indexOf(label) >= 0;
}

function startingGameState (): GameState {
  return {
    phase: GamePhase.Idle,
    time: 120,
    puzzles: [],
    solves: [0, 0, 0]
  };
}

var game_state : GameState = startingGameState();
function resetGameState () {
  game_state = startingGameState();
}

function updatedGameState () {
  io.sockets.emit('game-state-updated', game_state);
}

function random(max: number) {
  return Math.floor(Math.random() * max);
}

function generatePuzzle(solves: number) {
  var recipe = combos[solves][random(combos[solves].length)],
      ingredients = recipe.ingredients[random(recipe.ingredients.length)];
  
  // ingredient colors (indexes)
  var ingredientColors = [];
  for (var i = 0; i < ingredients.length; i++) {
    var color = random(colors.length);
    // make sure no same pieces have same colors
    for (var j = 0; j < i; j++) {
      if (ingredients[j] == ingredients[i] && color == ingredientColors[j]) {
        color = (color + 1) % colors.length;
        j = -1; // reset to search through again in case of >2 of same tile type
      }
    }

    ingredientColors[i] = color;
  }

  var tiles = [];
  for (var i = 0; i < ingredients.length; i++) {
    tiles[i] = {
      type: ingredients[i],
      color: ingredientColors[i]
    };
  }
  
  return {
    grid: normalize(recipe.grid, 4, 4),
    ingredients: tiles
  }
}

io.on('connect', function(socket: SocketIO.Socket){
  var name: null | string = null;
  console.log('a user connected: ' + socket.id);

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

  socket.on('start-game', function() {
    if (game_state.phase == GamePhase.NotConnected) {
      // TODO: handle disconnected state
    }
    if (game_state.phase == GamePhase.Playing) {
      return;
    }

    game_state.phase = GamePhase.Playing;
    for (var i = 0; i < 3; i++) {
      game_state.puzzles[i] = generatePuzzle(0);
    }

    updatedGameState();
  });

  socket.on('solved-puzzle', function (data: number) {
    if (game_state.phase != GamePhase.Playing) {
      return;
    }

    var solved = game_state.solves[data]++;
    game_state.puzzles[data] = generatePuzzle(solved);
    
    updatedGameState();
  });
});