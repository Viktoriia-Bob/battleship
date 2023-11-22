// eslint-disable-next-line import/no-extraneous-dependencies
import chalk from 'chalk';
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
      length: +this.size,
    }, () => Array(+this.size).fill(' '));
  }

  printBoard() {
    const colLabels = Array.from({
      length: this.size,
    }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));

    console.log(chalk.green.bgWhite.underline(` |${colLabels.join('|')}|`));
    this.board.forEach((row, i) => {
      console.log(chalk.underline(`${chalk.green.bgWhite(`${i}|`)}${row.join('|')}|`));
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

  removeShip(ship: Ship) {
    ship.coordinates.forEach(({ row, col }) => {
      this.board[row][col] = ' ';
    });
  }
}
