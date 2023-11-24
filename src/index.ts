import inquirer from 'inquirer';
import chalk from 'chalk';
import * as process from 'process';
import {
  Game,
} from './game';
import {
  GameNameActions,
  MainMenuEnum,
  MessagesEnum,
  RedisEnum,
} from './constants';
import {
  BoardSizeInput,
  ListInput,
  MainMenuInput,
  NameInput,
} from './models';
import {
  RedisConnection,
} from './redis-connection';

(async () => {
  const redisConnection = new RedisConnection();

  while (true) {
    console.clear();
    console.log(chalk.blue.bold(MessagesEnum.GAME_NAME));

    const response = await inquirer.prompt<MainMenuInput>([{
      type: 'list',
      name: 'mainMenu',
      message: 'Main Menu',
      choices: [MainMenuEnum.NEW_GAME, MainMenuEnum.CONTINUE_GAME, MainMenuEnum.EXIT],
    }]);

    if (response.mainMenu === MainMenuEnum.NEW_GAME) {
      let gameTitle = '';
      while (true) {
        const name = await inquirer.prompt<NameInput>([{
          type: 'input',
          name: 'name',
          message: MessagesEnum.ENTER_GAME_TITLE,
        }]);

        const gameTitles = JSON.parse(await redisConnection.get(RedisEnum.ALL_TITLES) || '[]') as string[];

        const index = gameTitles.indexOf(name.name);
        if (index !== -1) {
          const nameResponse = await inquirer.prompt<ListInput>([{
            type: 'list',
            name: 'select',
            message: MessagesEnum.GAME_NAME_EXISTS,
            choices: [GameNameActions.OVERWRITE, GameNameActions.NEW_NAME],
          }]);

          if (nameResponse.select === GameNameActions.NEW_NAME) continue;

          await redisConnection.delete(name.name);
          gameTitles.splice(index, 1);
        }
        gameTitles.push(name.name);

        if (gameTitles.length > 5) {
          gameTitles.shift();
        }

        await redisConnection.set(RedisEnum.ALL_TITLES, JSON.stringify(gameTitles));

        gameTitle = name.name;
        break;
      }

      const size = await inquirer.prompt<BoardSizeInput>([{
        type: 'input',
        name: 'size',
        message: MessagesEnum.ENTER_BOARD_SIZE,
        validate: (value) => (!Number.isNaN(value) ? value >= 2 || value <= 10 : false),
      }]);

      const game = new Game(gameTitle, redisConnection);
      await game.startNewGame(size.size);
    } else if (response.mainMenu === MainMenuEnum.CONTINUE_GAME) {
      const gameTitles = JSON.parse(await redisConnection.get(RedisEnum.ALL_TITLES) || '[]');

      const responseContinueGames = await inquirer.prompt<ListInput>([{
        type: 'list',
        name: 'select',
        message: MessagesEnum.SELECT_GAME,
        choices: [...gameTitles, MessagesEnum.MAIN_MENU],
      }]);

      if (responseContinueGames.select === MessagesEnum.MAIN_MENU) continue;

      const game = new Game(responseContinueGames.select, redisConnection);
      await game.continueGame();
    } else {
      break;
    }
  }

  process.exit();
})();
