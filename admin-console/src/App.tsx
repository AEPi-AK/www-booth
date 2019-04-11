import React, { Component } from 'react';
import logo from './logo.svg';

import './App.css';
import Socket from 'socket.io-client';

import { GameState, Tile, Color, TileType, GamePhase, HardwareState } from './shared/GameTypes';

var socket: SocketIOClient.Socket = Socket('http://192.168.1.8:3000/');

function subscribeToSocket(gameStateCallback: (gs: GameState) => void, hardwareStateCallback: (hs: HardwareState) => void) {
  socket.on('connect', () => {
    socket.emit('identification', 'console');
  });
  socket.on('game-state-updated', (gs: GameState) => {
    gameStateCallback(gs);
  });
  socket.on('hardware-state-updated', hardwareStateCallback);
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

function colorToText(color: Color) {
  return {
    [Color.Red]: "Red",
    [Color.Green]: "Green",
    [Color.Blue]: "Blue"
  }[color];
}

function typeToText(type: TileType) {
  return {
    [TileType.L]: "L",
    [TileType.O]: "O",
    [TileType.T]: "T",
    [TileType.Z]: "Z"
  }[type];
}

class App extends Component<{}, { gs: GameState | null, hs: HardwareState | null }> {
  constructor(props: {}) {
    super(props);
    this.state = { gs: null, hs: null };
    subscribeToSocket(this.gameStateUpdated.bind(this), this.hardwareStateUpdated.bind(this));
  }

  gameStateUpdated(gs: GameState) {
    this.setState({ gs });
  }

  hardwareStateUpdated(hs: HardwareState) {
    this.setState({ hs });
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

    let getTileButton = (tile: Tile) => {
      if (this.state.hs === null) {
        return '';
      }

      let disabled = false;

      let enableTile = () => {
        socket.emit('enable-tile', tile);
      }

      let disableTile = () => {
        socket.emit('disable-tile', tile);
      }

      for (let t of this.state.hs.disabledTiles) {
        if (t.type === tile.type && t.color === tile.color) {
          disabled = true;
        }
      }
      if (disabled) {
        return <div className="tile-button tile-button-disabled" onClick={enableTile}>
          {colorToText(tile.color)} {typeToText(tile.type)}
        </div>
      } else {
        return <div className="tile-button tile-button-enabled" onClick={disableTile}>
          {colorToText(tile.color)} {typeToText(tile.type)}
        </div>
      }
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
        <div className="row">
          <table>
            {[Color.Red, Color.Green, Color.Blue].map(color => (
              <tr>{[TileType.L, TileType.O, TileType.T, TileType.Z].map(type => (
                <td> {getTileButton({ color, type })}</td>
              ))}</tr>
            ))}
          </table>
        </div>
      </div>
    );
  }
}

export default App;
