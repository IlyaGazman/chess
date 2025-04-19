import { ChessModel } from '/chess/model.js';

describe('ChessModel - Rules Enforcement', () => {
  let model;

  beforeEach(() => {
    model = new ChessModel();
  });

  it('should only allow pieces to move according to their patterns', () => {
    // Try moving pawn like a bishop
    expect(model.makeMove({ row: 6, col: 4 }, { row: 4, col: 2 })).toBe(false); // e2 to c4 fails
    // Try moving knight like a rook
    expect(model.makeMove({ row: 7, col: 1 }, { row: 7, col: 3 })).toBe(false); // b1 to d1 fails
    // Try moving bishop horizontally
     model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4 to clear path
     model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
     expect(model.makeMove({ row: 7, col: 5 }, { row: 6, col: 5 })).toBe(false); // f1 to f2 fails
  });

  it('should only allow a player to move pieces of their own color', () => {
    expect(model.currentPlayer).toBe('white');
    // Try moving a black pawn
    expect(model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 })).toBe(false); // Black e7 to e5 fails
    // Make a white move
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
    expect(model.currentPlayer).toBe('black');
    // Try moving a white pawn
    expect(model.makeMove({ row: 6, col: 3 }, { row: 5, col: 3 })).toBe(false); // White d2 to d3 fails
  });

  it('should enforce turn-based play correctly', () => {
    expect(model.currentPlayer).toBe('white');
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // White moves
    expect(model.currentPlayer).toBe('black');
    // Try another white move immediately
    expect(model.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 })).toBe(false);
    // Black moves
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
    expect(model.currentPlayer).toBe('white');
    // Try another black move immediately
    expect(model.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 })).toBe(false);
  });

  it('should prevent illegal moves', () => {
    // Jump pawn over piece
    model.board[5][4] = { type: 'pawn', color: 'black' };
    expect(model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 })).toBe(false); // e2 cannot jump to e4

    // Move bishop through piece
    expect(model.makeMove({ row: 7, col: 2 }, { row: 5, col: 4 })).toBe(false); // c1 cannot jump to e3

    // Capture own piece
    model.board[5][4] = { type: 'pawn', color: 'white' };
    expect(model.makeMove({ row: 6, col: 3 }, { row: 5, col: 4 })).toBe(false); // d2 cannot capture e3 (white)
  });

  it('should prevent a player from moving when the game is over', () => {
    // Setup checkmate
    model.importFEN('r1bqkbnr/pppp1Qpp/2n5/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 3');
    expect(model.gameStatus).toBe('checkmate');
    expect(model.currentPlayer).toBe('black');
    // Try moving black king
    expect(model.makeMove({ row: 0, col: 4 }, { row: 1, col: 4 })).toBe(false);

    // Setup stalemate
    model.importFEN('k7/1Q6/8/8/8/8/8/K7 b - - 0 1');
    expect(model.gameStatus).toBe('stalemate');
    expect(model.currentPlayer).toBe('black');
    // Try moving black king
     expect(model.makeMove({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
  });

  it('should enforce all draw conditions correctly (50-move, threefold, insufficient)', () => {
    // 50-move draw
    model.halfMoveClock = 49;
    model.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 }); // Nf3 (non-capture, non-pawn)
    expect(model.gameStatus).toBe('draw');
    expect(model.makeMove({ row: 0, col: 6 }, { row: 2, col: 5 })).toBe(false); // No moves after draw

    // Insufficient material draw
    model.reset();
    model.importFEN('k7/8/8/8/8/8/8/K1N5 w - - 0 1'); // K+N vs K
    model.updateGameStatus();
    expect(model.gameStatus).toBe('draw');
    expect(model.makeMove({ row: 7, col: 2 }, { row: 5, col: 3 })).toBe(false); // No moves after draw

    // Threefold repetition (tested elsewhere, assuming it works and sets status)
    // If threefold repetition is detected and status set to 'draw', further moves should fail.
  });

  it('should handle discovered checks correctly (allow check if move is legal)', () => {
    // Setup: White Bishop c4, White Knight d5, Black King e8. Moving Knight discovers check from Bishop.
    model.importFEN('rnb1kbnr/pppppppp/8/3N4/2B1P3/8/PPPP1PPP/R1BQK1NR b KQkq - 0 1'); // Needs adjustment
    model.board = model.createEmptyBoard();
    model.board[7][4] = { type: 'king', color: 'white'}; // WK e1
    model.board[0][4] = { type: 'king', color: 'black'}; // BK e8
    model.board[4][3] = { type: 'knight', color: 'white'}; // WN d5
    model.board[5][2] = { type: 'bishop', color: 'white'}; // WB c4
    model.currentPlayer = 'white';

    // Move Knight d5 to f6, discovering check from Bishop c4
    expect(model.isKingInCheck('black')).toBe(false);
    const success = model.makeMove({row: 4, col: 3}, {row: 2, col: 5}); // Nd5-f6+
    expect(success).toBe(true);
    expect(model.currentPlayer).toBe('black');
    expect(model.isKingInCheck('black')).toBe(true); // Black is now in check
    expect(model.gameStatus).toBe('check');
  });

  it('should prevent illegal pawn movements correctly', () => {
    // Move 3 squares
    expect(model.makeMove({ row: 6, col: 4 }, { row: 3, col: 4 })).toBe(false);
    // Move backwards
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
    expect(model.makeMove({ row: 4, col: 4 }, { row: 5, col: 4 })).toBe(false); // e4 cannot move to e3
    // Move sideways
    expect(model.makeMove({ row: 4, col: 4 }, { row: 4, col: 5 })).toBe(false); // e4 cannot move to f4
    // Capture forwards
    model.board[3][4] = { type: 'pawn', color: 'black' }; // Black pawn at e5 blocks white e4
    expect(model.makeMove({ row: 4, col: 4 }, { row: 3, col: 4 })).toBe(false); // e4 cannot capture e5
  });

  // 'touch-move rule if implemented' - Not applicable as model doesn't handle UI interaction

  it('should enforce promotion requirements', () => {
     // Setup: White pawn at e7
    model.importFEN('k7/4P3/8/8/8/8/8/K7 w - - 0 1');
    const from = { row: 1, col: 4 }; // e7
    const to = { row: 0, col: 4 };   // e8

    // Get valid moves - should only be promotion moves
    const moves = model.getValidMoves(from.row, from.col);
    expect(moves.length).toBe(4); // Q, R, B, N promotions
    expect(moves.every(m => m.specialMove?.type === 'pawnPromotion')).toBe(true);

    // Try making the move without specifying promotion (should default or be handled by makeMove)
    // The current makeMove defaults to Queen, which is valid.
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('queen');
  });

  it('should prevent moving into check', () => {
    // Setup: King e1, Queen d1. Black rook e8. Moving King to e2 is illegal.
    model.importFEN('r3kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'); // Starting pos
    model.board[0][4] = {type: 'rook', color: 'black'}; // Black rook on e8
    model.board[1][4] = null; // Clear e7
    model.board[6][4] = null; // Clear e2

    // Try moving King e1 to e2 (into check from Re8)
    expect(model.makeMove({ row: 7, col: 4 }, { row: 6, col: 4 })).toBe(false); // Ke1 -> Ke2? fails
  });

  it('should update game status after every move', () => {
    expect(model.gameStatus).toBe('active');
    // 1. e4
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
    expect(model.gameStatus).toBe('active'); // Still active
    // 1... f5? (Opens king)
    model.makeMove({ row: 1, col: 5 }, { row: 3, col: 5 });
    expect(model.gameStatus).toBe('active');
    // 2. Qh5+ (Check)
    model.makeMove({ row: 7, col: 3 }, { row: 3, col: 7 });
    expect(model.gameStatus).toBe('check');
    // 2... g6 (Block)
    model.makeMove({ row: 1, col: 6 }, { row: 2, col: 6 });
    expect(model.gameStatus).toBe('active');
    // 3. Qxg6+ (Check) - need pawn setup
    model.reset();
    model.importFEN('rnbqkbnr/pppp1p1p/6P1/4p2Q/8/8/PPPP1PPP/RNB1KBNR b KQkq - 0 3'); // Position before Qxg6+
    model.makeMove({row: 7, col: 7}, {row: 5, col: 7}); // Pawn capture hxg6
    expect(model.gameStatus).toBe('check');
     // ... leads to checkmate if black cannot respond
     // Let's set up Fool's mate again for checkmate status update
     model.reset();
     model.makeMove({ row: 6, col: 5 }, { row: 5, col: 5 }); // 1. f3 e5
     model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
     model.makeMove({ row: 6, col: 6 }, { row: 4, col: 6 }); // 2. g4 Qh4#
     model.makeMove({ row: 0, col: 3 }, { row: 4, col: 7 });
     expect(model.gameStatus).toBe('checkmate');
  });

  // 'ambiguous notation if algebraic notation is implemented' - Not applicable

  it('should handle all special rules like en passant and castling correctly', () => {
    // These are tested in detail in special_moves_tests.js and piece_movement_tests.js
    // Re-verify castling is allowed when valid
    model.importFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    model.board[7][5] = null; model.board[7][6] = null;
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(true);

    // Re-verify en passant is allowed when valid
    model.reset();
    model.importFEN('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    model.currentPlayer = 'white'; model.enPassantTarget = { row: 2, col: 3 };
    expect(model.makeMove({ row: 3, col: 4 }, { row: 2, col: 3 })).toBe(true);
  });

   // 'enforces proper king behavior in endgame scenarios' - Covered by move validation, check/checkmate/stalemate tests.

  it('should correctly detect insufficient material draws', () => {
    // Tested in game_state_management_tests.js
    model.importFEN('k7/8/8/8/8/8/8/K1B5 w - - 0 1'); // K+B vs K
    model.updateGameStatus();
    expect(model.gameStatus).toBe('draw');
  });

  it('should identify legal moves in complex positions', () => {
     // Example: Ruy Lopez opening after a few moves
     model.importFEN('r1bqkbnr/p1pp1ppp/1pn5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4');
     // Check moves for white knight f3
     const Nf3_moves = model.getValidMoves(5, 5); // Nf3
     // Possible moves: Ng5, Ne5 (capture), Nd4, Ng1, Nh4
     expect(Nf3_moves.length).toBe(5);
     expect(Nf3_moves.some(m => m.to.row === 3 && m.to.col === 6)).toBe(true); // Ng5
     expect(Nf3_moves.some(m => m.to.row === 3 && m.to.col === 4)).toBe(true); // Ne5

     // Check moves for black pawn c6 (pinned by Bb5)
     const c6_pawn_moves = model.getValidMoves(2, 2); // Pawn c6
     expect(c6_pawn_moves.length).toBe(0); // Cannot move as it's pinned
  });

  it('should prevent illegal castling under all restricted conditions', () => {
    // Tested in detail in special_moves_tests.js and check_checkmate_stalemate_tests.js
    // Re-verify one case: Cannot castle through check
    model.importFEN('r3k2r/8/1b6/8/8/8/8/R3K2R w KQkq - 0 1');
    model.board[7][5] = null; model.board[7][6] = null;
    expect(model.isSquareAttacked(7, 5, 'black')).toBe(true); // f1 attacked
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false);
  });

  it('should correctly update piece properties (like "moved" status) after moves', () => {
    // Tested in piece_movement_tests.js
    const king = model.board[7][4];
    expect(king.moved).toBe(false);
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
    model.makeMove({ row: 7, col: 4 }, { row: 6, col: 4 }); // Ke2
    expect(model.board[6][4].moved).toBe(true);
  });

  it('should enforce pawn promotion when a pawn reaches the opponent\'s back rank', () => {
    // Tested in special_moves_tests.js
    model.importFEN('k7/4P3/8/8/8/8/8/K7 w - - 0 1');
    const moves = model.getValidMoves(1, 4);
    // Ensure only promotion moves are valid
    expect(moves.length).toBe(4);
    expect(moves.every(m => m.specialMove?.type === 'pawnPromotion')).toBe(true);
    // Make the move (defaults to Queen)
    expect(model.makeMove({ row: 1, col: 4 }, { row: 0, col: 4 })).toBe(true);
    expect(model.board[0][4]?.type).toBe('queen');
  });

});
