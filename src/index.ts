import inquirer from 'inquirer';
import {
  Game,
} from './game';

(async () => {
  console.clear();
  console.log('Start game');

  const size = await inquirer.prompt([{
    type: 'input',
    name: 'size',
    message: 'Enter board size (2-10):',
    validate: (value) => !Number.isNaN(value),
  }]);

  const game = new Game();
  await game.startGame(size.size);
})();
