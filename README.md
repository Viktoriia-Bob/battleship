# Battleship Console Game

## Description

This is a console-based Battleship game implemented in Node.js. Players can engage in a strategic 
battleship by taking turns to input ship placements and make attacks. The game state is stored in 
Redis, allowing players to seamlessly resume the game from where they left off.

## Table of Contents

- [Installation](#installation)
- [Gameplay](#gameplay)
- [Dependencies](#dependencies)
- [Collaboration](#collaboration)

## Installation

1. **Install Dependencies:**

```bash
npm install
```

2. **Configure Redis:**

Ensure that Redis is running separately. Create a .env file with the following variables:

```dotenv
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
```

3. **Start the Game:**

```bash
npm start
```

## Gameplay

1. **Game Initialization:**

 - When the user starts the project, they are prompted to enter the project name (for saving in Redis) and the size of the game board.
 - Users input this information in the console using the Inquirer library.

2. **Player Setup:**

 - In the same console, two players take turns entering their names and providing data for placing their ships.
 - For each board size, there is a specific number and size of ships that need to be placed.
 - Players input ship placement data in the format A:0, where 'A' is the column and '0' is the row where the ship should start.
 - If the ship size is greater than 1, players are prompted to specify the orientation: vertical or horizontal.
 - The console is used to read and display these inputs.

3. **Game Start:**

 - After ship placement, the game begins. Players take turns making moves.
 - Each player inputs their move in the format A:0, indicating the column and row to attack.
 - The console is cleared between turns using console.clear() to hide the opponent's moves.

4. **Game Progress:**

 - The game state is continuously updated and stored in Redis.
 - Players can interrupt the game, and it can be resumed from the last state by restarting with npm start.

5. **Winning the Game:**

 - The game continues until all the opponent's ships are sunk.
 - Once all the opponent's ships are destroyed, the game declares the current player as the winner.
 - The game concludes with a victory message for the winning player.

## Dependencies

- [Node.js](https://nodejs.org/en)
- [Redis](https://redis.io/)

## Collaboration

Feel free to contribute to the development of this Battleship game. Fork the repository, make your changes, and submit a pull request.

