import React, { Component } from 'react';
import Square from './Square';
import TileSprite from './Tile';
import './App.css';
import { GameState, Tile, Color, TileType, GamePhase, Puzzle } from './shared/GameTypes';
import images from './shared/Images';
import Sound from 'react-sound';

import Socket from 'socket.io-client';

var socket: SocketIOClient.Socket = Socket('http://monitor-5.local:3000/');

type GameStateCallback = ((gs: GameState) => void);

function subscribeToSocket(gameStateCallback: GameStateCallback, solvedCallback: (d: number) => void, errorCallback: (d: number) => void) {
  socket.on('connect', () => {
    socket.emit('identification', 'console');
  });

  socket.on('game-state-updated', (gs: GameState) => {
    console.log("updated");
    gameStateCallback(gs);
  });

  socket.on('solved-puzzle-sound', (data: number) => {
    console.log("solved!");
    solvedCallback(data);
  });

  socket.on('test', () => console.log('test!'));

  socket.on('wrong-submission', errorCallback);
}

type State = {
  phase: GamePhase
  squareMap: boolean[][] | null,
  solved: boolean,
  tiles: Tile[] | null,
  solves: number,
  time: number,
  websiteID: number,
  solvedSound: boolean,
  errorSound: boolean
};

let stationNumber: 0 | 1 | 2 = 0;

class App extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      phase: GamePhase.NotConnected,
      squareMap: null,
      solved: false,
      tiles: [{ color: Color.Red, type: TileType.T }, { color: Color.Green, type: TileType.Z }],
      solves: 0,
      time: 25,
      websiteID: 0,
      solvedSound: false,
      errorSound: false
    };
    subscribeToSocket(this.updateGameState.bind(this), this.solvedSound.bind(this), this.errorSound.bind(this));
  }

  updateGameState(gameState: GameState) {
    let newState: State = {
      phase: gameState.phase,
      squareMap: null,
      solved: this.state.solved,
      tiles: null,
      solves: gameState.solves[stationNumber],
      time: gameState.time,
      websiteID: this.state.websiteID,
      solvedSound: this.state.solvedSound,
      errorSound: this.state.errorSound,
    };
    let puz: Puzzle | null = gameState.puzzles[stationNumber];
    if (puz) {
      newState.squareMap = puz.grid.map(row => row.map(x => x === 1));
      newState.tiles = puz.ingredients;
      newState.websiteID = puz.id % images.length;
      newState.solved = puz.solved;
    }
    this.setState(newState);
  }

  solvedSound(data: number) {
    if (data !== stationNumber) {
      return;
    }
    this.setState({ solvedSound: true });
    setTimeout(() => this.setState({ solvedSound: false }), 2000);
  }

  errorSound(data: number) {
    if (data !== stationNumber) {
      return;
    }
    this.setState({ errorSound: true });
    setTimeout(() => this.setState({ errorSound: false }), 1000);
  }

  render() {
    switch (this.state.phase) {
      case GamePhase.PreGame:
        return this.renderPregame();
      case GamePhase.Playing:
        return this.renderPlaying();
      case GamePhase.PostGame:
        return this.renderPostgame();
      case GamePhase.Idle:
      default:
        return this.renderIdle();
    }
  }

  renderIdle() {
    return <div className="idlebox">
      Please wait for game to start
    </div>
  }

  renderPregame() {
    return <div className="pregamebox">Starting in {this.state.time}</div>
  }

  renderPostgame() {
    return <div className="postgamebox">Station score: {this.state.solves}</div>;
  }

  renderPlaying() {
    let { squareMap, tiles, websiteID, solves, time, solved, solvedSound, errorSound } = this.state;
    let squares = [0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => (
      <Square
        key={"" + row + col}
        isOn={squareMap !== null && squareMap[row][col] && !solved}
        row={row}
        col={col} />
    )))

    let tile_sprites = tiles === null || solved ? [] : tiles.map(({ type, color }) =>
      (
        <div className="tile-container">
          <TileSprite type={type} color={color} />
        </div>
      )
    )

    return (
      <div className="App">
        <div className="graphics">
          <div className={solved ? "website website-off" : "website"}>
            <img className="website-image" src={images[websiteID]} />
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
        {solvedSound ?
          //@ts-ignore
          <Sound url={process.env.PUBLIC_URL + "/correct.wav"} playStatus={Sound.status.PLAYING} /> : ''
        }
        {errorSound ?
          //@ts-ignore
          <Sound url={process.env.PUBLIC_URL + "/error.mp3"} playStatus={Sound.status.PLAYING} /> : ''
        }
      </div>
    );
  }
}

export default App;
