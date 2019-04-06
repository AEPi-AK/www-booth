import React, { Component } from 'react';
import Square from './Square';
import TileSprite from './Tile';
import './App.css';
import { GameState, Tile, Color, TileType } from './shared/GameTypes';

import Socket from 'socket.io-client';

var socket: SocketIOClient.Socket = Socket('http://localhost:3000/');

type GameStateCallback = ((gs: GameState) => void);

function subscribeToSocket(gameStateCallback: GameStateCallback) {
  socket.on('connect', () => {
    socket.emit('identification', 'console');
  });
  socket.on('update-game-state', (gs: GameState) => {
    gameStateCallback(gs);
  });
}

type State = { squareMap: boolean[][] | null, tiles: Tile[] | null, solves: number };

class App extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { squareMap: null, tiles: [{ color: Color.Red, type: TileType.T }, { color: Color.Green, type: TileType.Z }], solves: 0 };
  }

  updateGameState(gameState: GameState) {
    if (gameState && gameState.puzzles && gameState.puzzles[0]) {
      this.setState({
        squareMap: gameState.puzzles[0].grid.map(row => row.map(x => x === 1)),
        tiles: gameState.puzzles[0].ingredients,
        solves: gameState.solves[0]
      });
    } else {
      this.setState({ squareMap: null, tiles: null, solves: gameState.solves[0] });
    }
  }

  render() {
    let { squareMap, tiles, solves } = this.state;
    let squares = [0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => (
      <Square
        key={"" + row + col}
        isOn={squareMap !== null && squareMap[row][col]}
        row={row}
        col={col} />
    )))

    let tile_sprites = tiles === null ? [] : tiles.map(({ type, color }) =>
      (
        <div className="tile-container">
          <TileSprite type={type} color={color} />
        </div>
      )
    )

    return (
      <div className="App">
        <div className="graphics">
          <div className="website" />
          {squares}
          <div className="tiles-container">
            {tile_sprites}
          </div>
        </div>
        <div className="solvebox">
          Solved: {solves}
        </div>
      </div>
    );
  }
}

export default App;
