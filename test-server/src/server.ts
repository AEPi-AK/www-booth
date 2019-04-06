import Express = require('express');
import Http = require('http');
import IO = require('socket.io');
import readline = require('readline');
import { GameState, GamePhase, Puzzle, TileType, Color } from '../../shared/GameTypes';
import { isNumber } from 'util';
import { Socket } from 'dgram';

var app = Express();
var http = new Http.Server(app);
var io = IO(http, { 'pingInterval': 2000, 'pingTimeout': 5000 });
var clients: string[] = new Array<string>();


http.listen(3000, function () {
  console.log('listening on *:3000');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function startingGameState(): GameState {
  return {
    phase: GamePhase.Playing,
    time: 20,
    puzzles: [],
    solves: [0, 0, 0]
  };
}

let idle_time = 5;

var game_state: GameState = startingGameState();
function resetGameState() {
  game_state = startingGameState();
}

function updatedGameState() {
  io.sockets.emit('game-state-updated', game_state);
}

let game_started = false;
function startGame() {
  if (game_started) return;
  game_started = true;
  setInterval(tick, 1000);
}

io.on('connect', function (socket: SocketIO.Socket) {
  var name: null | string = null;
  console.log('a user connected: ' + socket.id);

  socket.on('identification', (name: string) => {
    console.log('identified as ' + name);
    if (name === "console") {
      startGame();
    }
  })
});

function tick(): void {
  if (game_state.phase === GamePhase.Idle) {
    console.log("ticked in idle, " + idle_time + " seconds remaining");
    updatedGameState();

    idle_time -= 1;
    if (idle_time <= 0) {
      game_state = startingGameState();
      game_state.phase = GamePhase.Playing;
    }


  } else {
    console.log("ticked in playing, " + game_state.time + " seconds remaining");
    if (game_state.time % 5 === 0) {
      game_state.puzzles = [{
        grid: [
          [0, 0, 0, 0],
          [0, 1, 0, 0],
          [1, 1, 1, 0],
          [1, 1, 1, 1]
        ],
        ingredients: [
          {
            type: TileType.T,
            color: Color.Red,
          },
          {
            type: TileType.Z,
            color: Color.Green,
          },
          {
            type: TileType.O,
            color: Color.Blue
          }
        ]
      }];
      game_state.solves[0] += 1;
    } else if (game_state.time % 5 === 2) {
      game_state.puzzles = [];
    }
    updatedGameState();

    game_state.time -= 1;
    if (game_state.time <= 0) {
      game_state.phase = GamePhase.Idle;
      idle_time = 5;
    }
  }

}
