import Express = require('express');
import Http = require('http');
import IO = require('socket.io');
import readline = require('readline');
import { GameState, GamePhase, Puzzle } from '../../shared/GameTypes';
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
    phase: GamePhase.NotConnected,
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
});