import React, { Component } from 'react';
import logo from './logo.svg';

import './App.css';
import Socket from 'socket.io-client';

import { GameState, Tile, Color, TileType, GamePhase } from './shared/GameTypes';

var socket: SocketIOClient.Socket = Socket('http://localhost:3000/');

function subscribeToSocket(gameStateCallback: (gs: GameState) => void) {
  socket.on('connect', () => {
    socket.emit('identification', 'console');
  });
  socket.on('game-state-updated', (gs: GameState) => {
    gameStateCallback(gs);
  });
}

function phaseToText(phase: GamePhase) {
  return {
    [GamePhase.Idle]: "Idle",
    [GamePhase.PreGame]: "Pre-game",
    [GamePhase.Playing]: "Playing",
    [GamePhase.PostGame]: "Post-game",
    [GamePhase.NotConnected]: "Not connected"
  }[phase];
}

class App extends Component<{}, { gs: GameState | null }> {
  constructor(props: {}) {
    super(props);
    this.state = { gs: null };
    subscribeToSocket(this.gameStateUpdated.bind(this));
  }

  gameStateUpdated(gs: GameState) {
    this.setState({ gs });
  }

  render() {
    if (this.state.gs === null) {
      return <div>Not connected</div>
    }

    let { phase, time, puzzles, solves } = this.state.gs;

    let startGame = () => {
      socket.emit('start-game');
    }

    let solvePuzzle = (index: number) => () => {
      socket.emit('solved-puzzle', index);
    }

    let resetGame = () => {
      socket.emit('reset-game');
    }
    return (
      <div className="layout">
        <div className="row">
          <button type="button" disabled={phase === GamePhase.Playing} onClick={startGame} > Start Game</button>
          <button type="button" onClick={resetGame}>Reset Game</button>
        </div>
        <div className="row">
          <span>Time: {time}</span>
          <span>Game Phase: {phaseToText(phase)}</span>
        </div>
        {[0, 1, 2].map(index => (
          <div className="row">
            <span>Station {index}</span>
            <span>Score: {solves[index]}</span>
            <span>Puzzle: {puzzles[index] === null ? "none" : puzzles[index]!.id}</span>
            <span><button type="button" disabled={puzzles[index] === null} onClick={solvePuzzle(index)}>Solve puzzle</button></span>
          </div>
        ))}
      </div>
    );
  }
}

export default App;
