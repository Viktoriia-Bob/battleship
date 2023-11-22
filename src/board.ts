import {
  Ship,
} from './models/ship';

export class Board {
  size = 8;

  board: string[][] = [];

  constructor(size: number) {
    this.size = size;

    this.board = this.createEmptyBoard();
  }

  createEmptyBoard() {
    return Array.from({
      length: this.size,
    }, () => Array(this.size).fill(' '));
  }

  printBoard() {
    const colLabels = Array.from({
      length: this.size,
    }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));

    console.log(`\x1b[4m |${colLabels.join('|')}|\x1b[0m`);
    this.board.forEach((row, i) => {
      console.log(`\x1b[4m${i}|${row.join('|')}|\x1b[0m`);
    });
  }

  placeShip(ship: Ship) {
    ship.coordinates.forEach(({ row, col }) => {
      this.board[row][col] = '█';
    });
  }

  isValidPlacement(ship: Ship) {
    return ship.coordinates.every(({ row, col }) => this.board[row][col] === ' ' && row <= this.size && col <= this.size);
  }
}
