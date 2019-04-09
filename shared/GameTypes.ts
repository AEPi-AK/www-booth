type maybePuzzle = Puzzle | null;

export interface HardwareState {
    stationA: {
        plate: boolean,
        monitor: boolean
    },
    stationB: {
        plate: boolean,
        monitor: boolean
    },
    stationC: {
        plate: boolean,
        monitor: boolean
    },
    adminConsole: boolean,
}

export interface GameState {
    phase: GamePhase,
    time: number,
    puzzles: [maybePuzzle, maybePuzzle, maybePuzzle],
    solves: [number, number, number],
    highScoreState: {
        highScore: number,
        newHighScore: boolean,
    }
}

export enum GamePhase {
    NotConnected, // This should only be set in the game-screen module.
    Idle,
    PreGame,
    Playing,
    PostGame
}

export interface Puzzle {
    id: number,
    grid: number[][],
    ingredients: Tile[]
}

export interface Tile {
    type: TileType,
    color: Color
}

// named based on tetris tile names
export enum TileType {
    L,
    O,
    T,
    Z
}

export enum Color {
    Red,
    Green,
    Blue
}
