import { TileType, Color } from './GameTypes';

var L = TileType.L,
  O = TileType.O,
  T = TileType.T,
  Z = TileType.Z;

export var colors = [Color.Red, Color.Green, Color.Blue];

// indexed by increasing number of tiles and difficulty
export var combos = [
  [ // 1 tile, easy difficulty
    {
      ingredients: [[Z]],
      grid: [
        [0, 1],
        [1, 1],
        [1, 0]
      ]
    },
    {
      ingredients: [[L]],
      grid: [
        [1, 1],
        [1, 0],
        [1, 0]
      ]
    },
    {
      ingredients: [[O]],
      grid: [
        [0, 0],
        [1, 1],
        [1, 1]
      ]
    },
    {
      ingredients: [[T]],
      grid: [
        [1, 0],
        [1, 1],
        [1, 0]
      ]
    }
  ],

  [ // 2 tiles, easy difficulty
    {
      ingredients: [[Z, Z]],
      grid: [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 0, 0, 1]
      ]
    },
    {
      ingredients: [[L, L]],
      grid: [
        [1, 0, 0, 1],
        [1, 0, 0, 1],
        [1, 1, 1, 1]
      ]
    },
    {
      ingredients: [[O, O]],
      grid: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1]
      ]
    },
    {
      ingredients: [[T, T]],
      grid: [
        [1, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 0, 0, 1]
      ]
    }
  ],

  [ // 2 tiles, medium difficulty
    {
      ingredients: [[Z, T]],
      grid: [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [1, 1, 1, 1]
      ]
    },
    {
      ingredients: [[O, T], [L, T]],
      grid: [
        [0, 1, 0, 0],
        [1, 1, 1, 1],
        [0, 1, 1, 1]
      ]
    },
    {
      ingredients: [[Z, Z], [L, L]],
      grid: [
        [0, 1, 0, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 0]
      ]
    },
    {
      ingredients: [[Z, L], [L, O]],
      grid: [
        [1, 1, 0],
        [1, 1, 1],
        [1, 1, 1]
      ]
    }
  ],

  [ // 3 tiles, medium difficulty
    {
      ingredients: [[Z, L, L], [L, L, O], [L, T, T]],
      grid: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1]
      ]
    }
  ],

  [ // 3tiles, hard difficulty
    {
      ingredients: [[Z, Z, T], [L, L, T], [O, O, T], [L, O, T], [Z, L, T]],
      grid: [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1]
      ]
    },
    {
      ingredients: [[L, L, T], [L, O, T], [Z, L, T]],
      grid: [
        [0, 0, 0, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 1, 0]
      ]
    },
    {
      ingredients: [[Z, Z, L], [Z, T, T]],
      grid: [
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 0, 0, 1]
      ]
    },
    {
      ingredients: [[O, O, O], [L, L, O]],
      grid: [
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [1, 1, 0, 0],
        [1, 1, 0, 0]
      ]
    },
    {
      ingredients: [[Z, T, T], [Z, Z, L], [L, O, O], [L, L, L]],
      grid: [
        [0, 0, 1, 1],
        [0, 1, 1, 1],
        [0, 1, 1, 1],
        [1, 1, 1, 1]
      ]
    },
    {
      ingredients: [[Z, L, T], [T, T, T]],
      grid: [
        [0, 1, 1, 1],
        [0, 0, 1, 1],
        [0, 1, 1, 1],
        [1, 1, 1, 1]
      ]
    },
  ]
]

// fits the shape into a rows x cols grid
// @requires grid's dimensions fit within rows x cols
export function normalize(grid: number[][], rows: number, cols: number) {
  var res = [],
    rowOffset = rows - grid.length;
  for (var i = 0; i < rows; i++) {
    var row = [];
    if (i < rowOffset) {
      for (var j = 0; j < cols; j++) {
        row.push(0);
      }
    }
    else {
      for (var j = 0; j < cols; j++) {
        if (j < grid[i - rowOffset].length) {
          row.push(grid[i - rowOffset][j]);
        }
        else {
          row.push(0);
        }
      }
    }
    res.push(row);
  }

  return res;
}