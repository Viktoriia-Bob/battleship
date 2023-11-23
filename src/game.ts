import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  Board,
} from './board';
import {
  BoardSize,
  ConfirmPositionEnum,
  MessagesEnum,
  OrientationEnum,
  PlayerActions,
  RedisEnum,
} from './constants';
import {
  CoordinatesInput,
  ListInput,
  Player,
  NameInput,
} from './models';
import {
  RedisConnection,
} from './redis-connection';
import {
  PreviousState,
} from './models/previous-state';

type BoardSizeType = typeof BoardSize;

export class Game {
  boardSize = 10;

  player1: Player;

  player2: Player;

  shipSizes = [4, 4];

  gameTitle: string;

  redisConnection: RedisConnection;

  constructor(gameTitle: string, redisConnection: RedisConnection) {
    this.gameTitle = gameTitle;
    this.redisConnection = redisConnection;
  }

  async startNewGame(boardSize: number) {
    this.boardSize = boardSize;
    const key = boardSize as keyof BoardSizeType;
    if (key in BoardSize) {
      this.shipSizes = BoardSize[key].ships;
    }

    const player1Name = await inquirer.prompt<NameInput>([{
      type: 'input',
      name: 'name',
      message: MessagesEnum.ENTER_PLAYER_1_NAME,
    }]);

    const player2Name = await inquirer.prompt<NameInput>([{
      type: 'input',
      name: 'name',
      message: MessagesEnum.ENTER_PLAYER_2_NAME,
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

  async continueGame() {
    const previousStateJson = await this.redisConnection.get(this.gameTitle);

    if (!previousStateJson) {
      console.log('Something wrong with this game session');
      return;
    }

    const previousState = JSON.parse(previousStateJson) as PreviousState;

    this.player1 = {
      ...previousState.player1,
      board: new Board(previousState.player1.board.size, previousState.player1.board.board),
      enemyBoard: new Board(previousState.player1.enemyBoard.size, previousState.player1.enemyBoard.board),
    };
    this.player2 = {
      ...previousState.player2,
      board: new Board(previousState.player2.board.size, previousState.player2.board.board),
      enemyBoard: new Board(previousState.player2.enemyBoard.size, previousState.player2.enemyBoard.board),
    };

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
        }, (_, index) => (start.orientation === OrientationEnum.HORIZONTAL ? {
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
          console.log(MessagesEnum.QUESTION_AFTER_PLACE_SHIP);
          player.board.printBoard();
          const response = await inquirer.prompt<ListInput>({
            type: 'list',
            name: 'select',
            choices: [ConfirmPositionEnum.CONFIRM_POSITION, ConfirmPositionEnum.CANCEL_POSITION],
          });

          if (response.select === ConfirmPositionEnum.CANCEL_POSITION) {
            player.board.removeShip(ship);
            continue;
          }

          break;
        } else {
          console.log(MessagesEnum.INVALID_PLACEMENT);
        }
      }
    }
  }

  async getPlayerInput(player: Player) {
    const response = await inquirer.prompt<CoordinatesInput>([
      {
        type: 'input',
        name: 'coordinates',
        message: `${player.name}, enter the coordinates for your hit (e.g., A:1 or B:2):`,
        validate: (value) => (/^[A-Ja-j]:[0-9]$/.test(value) ? true : MessagesEnum.ERROR_VALID_COORDINATES),
      },
    ]);

    const [col, row] = response.coordinates.toUpperCase().split(':');

    return {
      row: parseInt(row, 10),
      col: col.charCodeAt(0) - 'A'.charCodeAt(0),
    };
  }

  async getPlayerFirstInput(player: Player, size: number) {
    const response = await inquirer.prompt<CoordinatesInput>([
      {
        type: 'input',
        name: 'coordinates',
        message: `${player.name}, enter the coordinates for ship with size ${size} (e.g., A:1 or B:2):`,
        validate: (value) => (/^[A-Ja-j]:[0-9]$/.test(value) ? true : MessagesEnum.ERROR_VALID_COORDINATES),
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
    const response = await inquirer.prompt<ListInput>([
      {
        type: 'list',
        name: 'select',
        message: 'Select orientation:',
        choices: [OrientationEnum.HORIZONTAL, OrientationEnum.VERTICAL],
      },
    ]);

    return response.select;
  }

  isGameOver(player: Player) {
    return player.ships.every((ship) => ship.coordinates.every(({ row, col }) => player.board.board[row][col] === chalk.red('█')));
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

      await this.redisConnection.delete(this.gameTitle);

      const gameTitles = JSON.parse(await this.redisConnection.get(RedisEnum.ALL_TITLES) || '[]');

      const index = gameTitles.indexOf(this.gameTitle);
      gameTitles.splice(index, 1);

      await this.redisConnection.set(RedisEnum.ALL_TITLES, JSON.stringify(gameTitles));

      await inquirer.prompt({
        type: 'input',
        name: 'enter',
        message: MessagesEnum.MAIN_MENU,
      });

      return true;
    }

    await inquirer.prompt({
      type: 'input',
      name: 'enter',
      message: MessagesEnum.PRESS_ENTER,
    });

    await this.redisConnection.set(this.gameTitle, JSON.stringify({
      player1: enemy,
      player2: player,
    } as PreviousState));

    return false;
  }

  async playGame() {
    while (true) {
      console.log(`${this.player1.name}, what do you want to do?`);
      const response1 = await inquirer.prompt<ListInput>([{
        type: 'list',
        name: 'select',
        choices: [PlayerActions.SHOW_BOARD, chalk.red(PlayerActions.DESTROY_ENEMY)],
      }]);

      if (response1.select === PlayerActions.SHOW_BOARD) {
        console.clear();
        console.log(MessagesEnum.SHOW_YOUR_BOARD);
        this.player1.board.printBoard();

        await inquirer.prompt({
          type: 'input',
          name: 'enter',
          message: MessagesEnum.PRESS_ENTER,
        });
      }

      const isEnd = await this.gameStep(this.player1, this.player2);
      if (isEnd) break;

      console.log(`${this.player2.name}, what do you want to do?`);
      const response2 = await inquirer.prompt<ListInput>([{
        type: 'list',
        name: 'select',
        choices: [PlayerActions.SHOW_BOARD, chalk.red(PlayerActions.DESTROY_ENEMY)],
      }]);

      if (response2.select === PlayerActions.SHOW_BOARD) {
        console.clear();
        console.log(MessagesEnum.SHOW_YOUR_BOARD);
        this.player2.board.printBoard();

        await inquirer.prompt({
          type: 'input',
          name: 'enter',
          message: MessagesEnum.PRESS_ENTER,
        });
      }

      const isEnd2 = await this.gameStep(this.player2, this.player1);
      if (isEnd2) break;
    }
  }
}
