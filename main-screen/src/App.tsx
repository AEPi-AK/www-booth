import React, { Component } from 'react';
import fs from 'fs';
import { GameState, GamePhase, TileType, Color } from './shared/GameTypes';
import Socket from 'socket.io-client';
import './App.css';
import PuzzleDisplay from './Puzzle';

var socket: SocketIOClient.Socket = Socket('http://localhost:3000/');

function subscribeToSocket(gameStateCallback: (gs: GameState) => void) {
  socket.on('connect', () => {
    socket.emit('identification', 'console');
  });
  socket.on('game-state-updated', (gs: GameState) => {
    gameStateCallback(gs);
  });
}

let testPuzzle = {
  id: 3,
  grid: [[0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]],
  ingredients: [{ color: Color.Red, type: TileType.O }]
}

class App extends Component<{}, { gs: GameState }> {
  constructor(props: {}) {
    super(props);
    this.state = { gs: { phase: GamePhase.Idle, time: 120, puzzles: [null, null, null], solves: [0, 0, 0] } };
    subscribeToSocket(this.gameStateUpdated.bind(this));
  }

  gameStateUpdated(gs: GameState) {
    this.setState({ gs });
  }

  renderPlaying() {
    let { phase, time, puzzles, solves } = this.state.gs;
    return (
      <div className="App">
        <div className="boxrow">
          <div className="scorebox">Total score: {solves[0] + solves[1] + solves[2]}</div>
          <div className="time">Time: {time}</div>
        </div>
        <div className="puzzlerow">
          {[0, 1, 2].map(i => (
            <div className="puzzleSlot" key={i}>
              <div className="puzzleName">Station {i + 1}</div>
              {
                puzzles[i] !== null ?
                  <PuzzleDisplay puzzle={puzzles[i]!} /> :
                  <div className="puzzleFiller">No puzzle</div>
              }
              <div className="puzzleScore">Score: {solves[i]}</div>

            </div>
          ))}
        </div>
      </div >
    );
  }

  render() {
    return this.renderPlaying();
  }
}

export default App;
