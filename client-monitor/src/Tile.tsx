import React, { Component } from 'react';
import { Tile, Color, TileType } from './shared/GameTypes'
import { tilePositions } from './shared/Data';
import './Tile.css';

let SQUARE_SIZE = 50;

type Props = Tile;

let colorToCSS = (color: Color) => {
  return {
    [Color.Red]: "red",
    [Color.Green]: "green",
    [Color.Blue]: "blue"
  }[color];
}


class TileSquare extends Component<{ row: number, col: number, color: Color }> {
  render() {
    let { row, col, color } = this.props;
    let top = row * SQUARE_SIZE;
    let left = col * SQUARE_SIZE;
    return <div className="tile-square" style={{ top, left, backgroundColor: colorToCSS(color) }} />
  }
}

class TileSprite extends Component<Props> {
  render() {
    let { color, type } = this.props;
    let squares = tilePositions(type).map(pos => <TileSquare key={"" + pos[0] + pos[1]} row={pos[1]} col={pos[0]} color={color} />)
    return (
      <div className="tile">
        {squares}
      </div>
    )
  }
}

export default TileSprite;