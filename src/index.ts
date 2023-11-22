import {
  Game,
} from './game';

(async () => {
  console.clear();
  console.log('Start...');
  const game = new Game();
  await game.startGame();
})();
