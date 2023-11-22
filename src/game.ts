import inquirer from 'inquirer';
import {
  Player,
} from './models/player';
import {
  Board,
} from './board';

export class Game {
  boardSize = 10;

  player1: Player;

  player2: Player;

  shipSizes = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

  async startGame() {
    const player1Name = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter Player 1 name:',
    }]);

    const player2Name = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter Player 2 name:',
    }]);

    this.player1 = {
      name: player1Name.name,
      board: new Board(this.boardSize),
      enemyBoard: new Board(this.boardSize),
      ships: this.shipSizes.map((size) => ({
        size,
        coordinates: [],
      })),
    };

    this.player2 = {
      name: player2Name.name,
      board: new Board(this.boardSize),
      enemyBoard: new Board(this.boardSize),
      ships: this.shipSizes.map((size) => ({
        size,
        coordinates: [],
      })),
    };

    await this.placeShips(this.player1);

    console.clear();

    await this.placeShips(this.player2);

    console.clear();
    await this.playGame();
  }

  async placeShips(player: Player) {
    console.log(`${player.name}, place your ships on the board:`);

    // eslint-disable-next-line no-restricted-syntax,no-unreachable-loop
    for (const ship of player.ships) {
      while (true) {
        player.board.printBoard();
        const start = await this.getPlayerFirstInput(player, ship.size);

        const coordinates = Array.from({
          length: ship.size,
        }, (_, index) => (start.orientation === 'horizontal' ? {
          row: start.row,
          col: start.col + index,
        } : {
          row: start.row + index,
          col: start.col,
        }));

        if (player.board.isValidPlacement({
          size: ship.size,
          coordinates,
        })) {
          ship.coordinates = coordinates;
          player.board.placeShip(ship);
          break;
        } else {
          console.log('Invalid placement. Try again.');
        }
      }
    }
  }

  async getPlayerInput(player: Player) {
    const response = await inquirer.prompt([
      {
        type: 'input',
        name: 'coordinates',
        message: `${player.name}, enter the coordinates for your hit (e.g., A:1 or B:2):`,
        validate: (value) => /^[A-Ja-j]:[0-9]$/.test(value),
      },
    ]);

    const [col, row] = response.coordinates.toUpperCase().split(':');

    return {
      row: parseInt(row, 10),
      col: col.charCodeAt(0) - 'A'.charCodeAt(0),
    };
  }

  async getPlayerFirstInput(player: Player, size: number) {
    const response = await inquirer.prompt([
      {
        type: 'input',
        name: 'coordinates',
        message: `${player.name}, enter the coordinates for ship with size ${size} (e.g., A:1 or B:2):`,
        validate: (value) => /^[A-Ja-j]:[0-9]$/.test(value),
      },
    ]);

    const [col, row] = response.coordinates.toUpperCase().split(':');
    const orientation = await this.askForShipOrientation();

    return {
      row: parseInt(row, 10),
      col: col.charCodeAt(0) - 'A'.charCodeAt(0),
      orientation,
    };
  }

  async askForShipOrientation() {
    const response = await inquirer.prompt([
      {
        type: 'list',
        name: 'orientation',
        message: 'Select orientation:',
        choices: ['horizontal', 'vertical'],
      },
    ]);

    return response.orientation;
  }

  isGameOver(player: Player) {
    return player.ships.every((ship) => ship.coordinates.every(({ row, col }) => player.board.board[row][col] === 'X'));
  }

  async playGame() {
    while (true) {
      console.clear();
      console.log(`${this.player1.name}'s turn:`);
      this.player1.enemyBoard.printBoard();

      const shot1 = await this.getPlayerInput(this.player1);

      console.clear();
      if (this.player2.board.board[shot1.row][shot1.col] === '█') {
        this.player1.enemyBoard.board[shot1.row][shot1.col] = 'X';
        this.player2.board.board[shot1.row][shot1.col] = 'X';

        this.player1.enemyBoard.printBoard();
        console.log('Hit!');
      } else {
        this.player1.enemyBoard.board[shot1.row][shot1.col] = 'O';
        this.player2.board.board[shot1.row][shot1.col] = 'O';

        this.player1.enemyBoard.printBoard();
        console.log('Miss!');
      }

      if (this.isGameOver(this.player2)) {
        console.clear();
        console.log(`${this.player1.name} wins!`);
        break;
      }

      await inquirer.prompt({
        type: 'input',
        name: 'enter',
        message: 'Press Enter for next turn.',
      });

      console.clear();
      console.log(`${this.player2.name}'s turn:`);
      this.player2.enemyBoard.printBoard();

      const shot2 = await this.getPlayerInput(this.player2);

      console.clear();
      if (this.player1.board.board[shot2.row][shot2.col] === '█') {
        this.player2.enemyBoard.board[shot2.row][shot2.col] = 'X';
        this.player1.board.board[shot2.row][shot2.col] = 'X';

        this.player2.enemyBoard.printBoard();
        console.log('Hit!');
      } else {
        this.player2.enemyBoard.board[shot2.row][shot2.col] = 'O';
        this.player1.board.board[shot2.row][shot2.col] = 'O';

        this.player2.enemyBoard.printBoard();
        console.log('Miss!');
      }

      if (this.isGameOver(this.player1)) {
        console.clear();
        console.log(`${this.player2.name} wins!`);
        break;
      }

      await inquirer.prompt({
        type: 'input',
        name: 'enter',
        message: 'Press Enter for next turn.',
      });
    }
  }
}
