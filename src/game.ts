import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  Player,
} from './models/player';
import {
  Board,
} from './board';
import {
  BoardSize,
} from './constants';

type BoardSizeType = typeof BoardSize;

export class Game {
  boardSize = 10;

  player1: Player;

  player2: Player;

  shipSizes = [4, 4];

  async startGame(boardSize: number) {
    this.boardSize = boardSize;
    const key = boardSize as keyof BoardSizeType;
    if (key in BoardSize) {
      this.shipSizes = BoardSize[key].ships;
    }

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

          console.clear();
          console.log('This is what your board looks like now, would you like to continue?');
          player.board.printBoard();
          const response = await inquirer.prompt({
            type: 'list',
            name: 'select',
            choices: ['Yes, continue', 'Cancel the last ship'],
          });

          if (response.select === 'Cancel the last ship') {
            player.board.removeShip(ship);
            continue;
          }

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
        validate: (value) => (/^[A-Ja-j]:[0-9]$/.test(value) ? true : 'Please enter a valid coordinates!'),
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
        validate: (value) => (/^[A-Ja-j]:[0-9]$/.test(value) ? true : 'Please enter a valid coordinates!'),
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
    return player.ships.every((ship) => ship.coordinates.every(({ row, col }) => {
      console.log(player.board.board[row][col]);
      return player.board.board[row][col] === chalk.red('█');
    }));
  }

  async gameStep(player: Player, enemy: Player) {
    console.clear();
    console.log(`${player.name}'s turn:`);
    player.enemyBoard.printBoard();

    const shot = await this.getPlayerInput(player);

    console.clear();
    if (enemy.board.board[shot.row][shot.col] === '█') {
      player.enemyBoard.board[shot.row][shot.col] = 'X';
      enemy.board.board[shot.row][shot.col] = chalk.red('█');

      player.enemyBoard.printBoard();
      console.log('Hit!');
    } else {
      player.enemyBoard.board[shot.row][shot.col] = 'O';
      enemy.board.board[shot.row][shot.col] = 'O';

      player.enemyBoard.printBoard();
      console.log('Miss!');
    }

    if (this.isGameOver(enemy)) {
      console.clear();
      enemy.board.printBoard();
      console.log(`${player.name} wins!`);
      return true;
    }

    await inquirer.prompt({
      type: 'input',
      name: 'enter',
      message: 'Press Enter for next turn.',
    });

    return false;
  }

  async playGame() {
    while (true) {
      console.log(`${this.player1.name}, what do you want to do?`);
      const response1 = await inquirer.prompt([{
        type: 'list',
        name: 'isShowBoard',
        choices: ['Show my board', chalk.red('Destroy the enemy!')],
      }]);

      if (response1.isShowBoard === 'Show my board') {
        console.clear();
        console.log('Here is your board:');
        this.player1.board.printBoard();

        await inquirer.prompt({
          type: 'input',
          name: 'enter',
          message: 'Press Enter for next turn.',
        });
      }

      const isEnd = await this.gameStep(this.player1, this.player2);
      if (isEnd) break;

      console.log(`${this.player2.name}, what do you want to do?`);
      const response2 = await inquirer.prompt([{
        type: 'list',
        name: 'isShowBoard',
        choices: ['Show my board', chalk.red('Destroy the enemy!')],
      }]);

      if (response2.isShowBoard === 'Show my board') {
        console.clear();
        console.log('Here is your board:');
        this.player2.board.printBoard();

        await inquirer.prompt({
          type: 'input',
          name: 'enter',
          message: 'Press Enter for next turn.',
        });
      }

      const isEnd2 = await this.gameStep(this.player2, this.player1);
      if (isEnd2) break;
    }
  }
}
