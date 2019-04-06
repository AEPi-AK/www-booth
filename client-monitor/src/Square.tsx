import React, { Component } from 'react';
import './Square.css';


class Square extends Component<{ isOn: boolean, row: number, col: number }>{
  render() {
    let { isOn, row, col } = this.props;
    return (
      <div className={!isOn ? "square square-clear" : "square"}
        style={{ top: row * 100, left: col * 100 }} />
    )
  }
}

export default Square;
