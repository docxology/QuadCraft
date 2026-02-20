const { Quadray } = require('./4d_generic/quadray.js');
const { ConnectFourBoard } = require('./4d_connect_four/js/connect_four_board.js');
const board4 = new ConnectFourBoard(6, 5, 3, 3);
board4.dropPiece(0, 1, 1); // P1 at b=0
board4.dropPiece(0, 1, 0); // P2
board4.dropPiece(1, 1, 1); // P1 at b=1
board4.dropPiece(1, 1, 0); // P2
board4.dropPiece(2, 1, 1); // P1 at b=2
board4.dropPiece(2, 1, 0); // P2
board4.dropPiece(3, 1, 1); // P1 at b=3
console.log(board4.moveHistory[board4.moveHistory.length - 1]);
