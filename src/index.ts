import {
  Game,
} from './game';

(async () => {
  console.clear();
  console.log('Start game');
  const game = new Game();
  await game.startGame();
})();
