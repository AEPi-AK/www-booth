import React, { Component } from 'react';
import Square from './Square';
import TileSprite from './Tile';
import './App.css';
import { GameState, Tile, Color, TileType, GamePhase } from './shared/GameTypes';

import Canvas from './images/canvas.png';
import UCStones from './images/ucstones.png';
import StackOverflow from './images/stackoverflow.png';
import Wikipedia from './images/wikipedia.png';
import YouTube from './images/youtube.png';

import Socket from 'socket.io-client';

var socket: SocketIOClient.Socket = Socket('http://localhost:3000/');

let images = [
  Canvas,
  UCStones,
  StackOverflow,
  Wikipedia,
  YouTube
];

type GameStateCallback = ((gs: GameState) => void);

function subscribeToSocket(gameStateCallback: GameStateCallback) {
  socket.on('connect', () => {
    socket.emit('identification', 'console');
  });
  socket.on('game-state-updated', (gs: GameState) => {
    gameStateCallback(gs);
  });
}

type State = { playing: boolean, squareMap: boolean[][] | null, tiles: Tile[] | null, solves: number, time: number };

class App extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { playing: false, squareMap: null, tiles: [{ color: Color.Red, type: TileType.T }, { color: Color.Green, type: TileType.Z }], solves: 0, time: 25 };
    subscribeToSocket(this.updateGameState.bind(this));
  }

  updateGameState(gameState: GameState) {
    let in_puzzle = gameState && gameState.puzzles && gameState.puzzles[0];
    this.setState({
      playing: gameState.phase === GamePhase.Playing,
      squareMap: in_puzzle ?
        gameState.puzzles[0].grid.map(row => row.map(x => x === 1)) : null,
      tiles: in_puzzle ? gameState.puzzles[0].ingredients : null,
      solves: gameState.solves[0],
      time: gameState.time
    });
  }

  render() {
    return this.state.playing ? this.renderPlaying() : this.renderIdle();
  }

  renderIdle() {
    return <div className="idlebox">
      Please wait for game to start
    </div>
  }

  renderPlaying() {
    let { squareMap, tiles, solves, time } = this.state;
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
          <div className="website">
            <img className="website-image" src={Wikipedia} />
          </div>
          {squares}
          <div className="tiles-container">
            {tile_sprites}
          </div>
        </div>
        <div className="solvebox">
          Solved: {solves}
        </div>
        <div className="timebox">
          Time: {time}
        </div>
      </div>
    );
  }
}

export default App;
