import React, { Component } from 'react';
import { Color, TileType, Tile, Puzzle } from './shared/GameTypes';
import images from './shared/Images';
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

function TilePiece(props: { tile: Tile, hidden: boolean }) {
  let { color, type } = props.tile;
  return (
    <div className="tile">
      {tilePositions(type).map(pos => <Square row={pos[1]} col={pos[0]} color={colorToCSS(color)} on={!props.hidden} size={15} />)}
    </div>
  );

}

type PuzzleProps = { puzzle: Puzzle };
function PuzzleDisplay(props: PuzzleProps) {
  let { grid, ingredients, id, solved } = props.puzzle;

  let positions = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2], [1, 3], [2, 0], [2, 1], [2, 2], [2, 3], [3, 0], [3, 1], [3, 2], [3, 3]];
  return (<div className="puzzle">
    <div className={solved ? "puzzle-grid puzzle-grid-solved" : "puzzle-grid"}>
      <img className="puzzlepic" src={images[id % images.length]} />
      {positions.map(pos => <Square row={pos[0]} col={pos[1]} color="black" on={grid[pos[0]][pos[1]] === 1 && !solved} size={30} />)}
    </div>
    <div className="tiles">
      {solved ? '' : ingredients.map(tile => <TilePiece tile={tile} hidden={solved} />)}
    </div>
  </div>);
}

export default PuzzleDisplay;