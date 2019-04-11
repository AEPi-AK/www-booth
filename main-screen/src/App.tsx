import React, { Component } from 'react';
import fs from 'fs';
import { GameState, GamePhase, TileType, Color } from './shared/GameTypes';
import Socket from 'socket.io-client';
import './App.css';
import PuzzleDisplay from './Puzzle';

var socket: SocketIOClient.Socket = Socket('http://192.168.1.3:3000/');

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

type State = { gs: GameState | null };

class App extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      gs: null,
    };
    subscribeToSocket(this.gameStateUpdated.bind(this));
  }


  gameStateUpdated(gs: GameState) {
    this.setState({ gs });
  }

  renderNotConnected() {
    return <div>Not connected</div>;
  }

  renderIdle(gs: GameState) {
    let { highScoreState, solves } = gs;
    let score = solves[0] + solves[1] + solves[2];
    return (
      <div className="bigbox">
        {highScoreState.newHighScore ? <div className="row">New high score!</div> : ''}
        <div className="row">Your score: {score}</div>
        <div className="row">High score: {highScoreState.highScore}</div>
      </div>
    );
  }

  renderPregame(gs: GameState) {
    let { time } = gs;
    return <div className="bigbox">Starting in {time}</div>;
  }

  renderPostgame(gs: GameState) {
    return <div className="bigbox">Postgame</div>;
  }

  renderPlaying(gs: GameState) {
    let { phase, time, puzzles, solves } = gs;
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
    if (this.state.gs === null) {
      return this.renderNotConnected();
    }
    switch (this.state.gs.phase) {
      case GamePhase.PreGame:
        return this.renderPregame(this.state.gs);
      case GamePhase.Playing:
        return this.renderPlaying(this.state.gs);
      case GamePhase.PostGame:
        return this.renderPostgame(this.state.gs);
      case GamePhase.Idle:
        return this.renderIdle(this.state.gs);
      case GamePhase.NotConnected:
        return this.renderNotConnected();
    }
  }

}

export default App;
