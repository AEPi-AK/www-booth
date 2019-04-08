import React, { Component } from 'react';
import { Color, TileType, Tile, Puzzle } from './shared/GameTypes';
import './Puzzle.css';


type SquareProps = { row: number, col: number, on: boolean, color: string, size: number };
function Square(props: SquareProps) {
  let { row, col, on, color, size } = props;
  return (
    <div className={on ? "square" : "square square-clear"}
      style={{ width: size, height: size, top: row * size, left: col * size, backgroundColor: color }} />
  )
}

let colorToCSS = (color: Color) => {
  if (color === Color.Red) {
    return "red";
  } else if (color === Color.Green) {
    return "green";
  } else { // blue
    return "blue";
  }
}

let tilePositions = (type: TileType) => {
  if (type === TileType.L) {
    return [[0, 0], [0, 1], [0, 2], [1, 2]];
  } else if (type === TileType.O) {
    return [[0, 1], [1, 1], [0, 2], [1, 2]];
  } else if (type === TileType.T) {
    return [[0, 0], [0, 1], [0, 2], [1, 1]];
  } else { // Z
    return [[0, 0], [0, 1], [1, 1], [1, 2]];
  }
}

function TilePiece(props: { tile: Tile }) {
  let { color, type } = props.tile;
  return (
    <div className="tile">
      {tilePositions(type).map(pos => <Square row={pos[1]} col={pos[0]} color={colorToCSS(color)} on size={15} />)}
    </div>
  );

}

type PuzzleProps = { puzzle: Puzzle };
function PuzzleDisplay(props: PuzzleProps) {
  let { grid, ingredients } = props.puzzle;

  let positions = [0, 1, 2, 3].map(i => [[i, 0], [i, 1], [i, 2], [i, 3]]).flat();

  return (<div className="puzzle">
    <div className="puzzle-grid">
      {positions.map(pos => <Square row={pos[0]} col={pos[1]} color="black" on={grid[pos[0]][pos[1]] === 1} size={30} />)}
    </div>
    <div className="tiles">
      {ingredients.map(tile => <TilePiece tile={tile} />)}
    </div>
  </div>);
}

export default PuzzleDisplay;