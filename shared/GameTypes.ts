export interface GameState {
    phase: GamePhase,
    time: number,
    puzzles: Puzzle[],
    solves: number[]
}

export enum GamePhase {
    NotConnected, // This should only be set in the game-screen module.
    Idle,
    Playing
}

export interface Puzzle {

}
