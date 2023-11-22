import {
  Ship,
} from './ship';
import {
  Board,
} from '../board';

export interface Player {
  board: Board;
  enemyBoard: Board;
  name: string;
  ships: Ship[];
}
