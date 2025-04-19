import { ChessModel } from '/chess/model.js';

describe('ChessModel - Special Moves', () => {
  let model;

  beforeEach(() => {
    model = new ChessModel();
  });

  // --- Castling ---
  it('should allow kingside castling when all conditions are met', () => {
    // Setup: Clear f1, g1. White has Kingside rights. Not in check. Squares not attacked.
    model.importFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Standard setup often allows this initially
    model.board[7][5] = null; // Clear f1
    model.board[7][6] = null; // Clear g1
    model.castlingRights.white.kingSide = true; // Ensure right exists

    const from = { row: 7, col: 4 }; // e1
    const to = { row: 7, col: 6 };   // g1 (castle destination)
    const success = model.makeMove(from, to);

    expect(success).toBe(true);
    expect(model.board[7][6]?.type).toBe('king');
    expect(model.board[7][5]?.type).toBe('rook');
    expect(model.board[7][4]).toBeNull();
    expect(model.board[7][7]).toBeNull();
    expect(model.castlingRights.white.kingSide).toBe(false); // Rights are used up
    expect(model.castlingRights.white.queenSide).toBe(false); // King move revokes both
  });

  it('should allow queenside castling when all conditions are met', () => {
    // Setup: Clear b1, c1, d1. White has Queenside rights. Not in check. Squares not attacked.
    model.importFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    model.board[7][1] = null; // Clear b1
    model.board[7][2] = null; // Clear c1
    model.board[7][3] = null; // Clear d1
    model.castlingRights.white.queenSide = true;

    const from = { row: 7, col: 4 }; // e1
    const to = { row: 7, col: 2 };   // c1
    const success = model.makeMove(from, to);

    expect(success).toBe(true);
    expect(model.board[7][2]?.type).toBe('king');
    expect(model.board[7][3]?.type).toBe('rook');
    expect(model.board[7][4]).toBeNull();
    expect(model.board[7][0]).toBeNull();
    expect(model.castlingRights.white.kingSide).toBe(false); // King move revokes both
    expect(model.castlingRights.white.queenSide).toBe(false);
  });

  it('should not allow castling when the king has moved', () => {
    // Setup: Move king, then move back. Clear path.
    model.importFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    model.board[7][5] = null; model.board[7][6] = null; // Clear path
    model.makeMove({row: 7, col: 4}, {row: 6, col: 4}); // Ke2
    model.makeMove({row: 0, col: 4}, {row: 1, col: 4}); // Black Ke7 (dummy move)
    model.makeMove({row: 6, col: 4}, {row: 7, col: 4}); // Ke1 (move back)
    model.makeMove({row: 1, col: 4}, {row: 0, col: 4}); // Black Ke8 (dummy move)

    // King has moved, even though back in original square
    expect(model.board[7][4]?.moved).toBe(true); // King moved status true
    expect(model.castlingRights.white.kingSide).toBe(false); // Rights should be false
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle
  });

  it('should not allow castling when the relevant rook has moved', () => {
     // Setup: Move rook, then move back. Clear path.
     model.importFEN('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
     model.board[7][5] = null; model.board[7][6] = null; // Clear path
     model.makeMove({row: 7, col: 7}, {row: 6, col: 7}); // Rh2
     model.makeMove({row: 0, col: 4}, {row: 1, col: 4}); // Black Ke7
     model.makeMove({row: 6, col: 7}, {row: 7, col: 7}); // Rh1 (move back)
     model.makeMove({row: 1, col: 4}, {row: 0, col: 4}); // Black Ke8

     expect(model.board[7][7]?.moved).toBe(true); // Rook moved status true
     expect(model.castlingRights.white.kingSide).toBe(false); // Rights should be false
     expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle
  });

  it('should not allow castling when there are pieces between the king and rook', () => {
    // Kingside blocked by Bishop f1
    model.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(model.board[7][5]?.type).toBe('bishop'); // Bishop on f1
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside

    // Queenside blocked by Knight b1
    model.board[7][1] = { type: 'knight', color: 'white' }; // Ensure knight is there
    model.board[7][2] = null; model.board[7][3] = null; // Clear c1, d1
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 2 })).toBe(false); // Cannot castle queenside
  });

  it('should not allow castling when the king is in check', () => {
    // Setup: King e1 in check by Queen e2
    model.importFEN('4k3/8/8/8/8/8/4q3/R3K2R w KQ - 0 1'); // Clear path for castling otherwise
    model.board[7][5] = null; model.board[7][6] = null; // Clear kingside path
    model.board[7][1] = null; model.board[7][2] = null; model.board[7][3] = null; // Clear queenside path
    expect(model.isKingInCheck('white')).toBe(true);
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 2 })).toBe(false); // Cannot castle queenside
  });

  it('should not allow castling when the king would move through a square that is under attack', () => {
    // Setup: Kingside castling blocked by attack on f1 (Black Bishop b6)
    model.importFEN('r3k2r/8/1b6/8/8/8/8/R3K2R w KQkq - 0 1'); // Path is clear
    model.board[7][5] = null; model.board[7][6] = null; // Clear f1, g1 manually
    expect(model.isSquareAttacked(7, 5, 'black')).toBe(true); // f1 is attacked
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside

    // Setup: Queenside castling blocked by attack on d1 (Black Rook d8)
    model.importFEN('3rkr2/8/8/8/8/8/8/R3K2R w KQkq - 0 1'); // Path is clear
    model.board[7][1] = null; model.board[7][2] = null; model.board[7][3] = null; // Clear b1, c1, d1
    expect(model.isSquareAttacked(7, 3, 'black')).toBe(true); // d1 is attacked
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 2 })).toBe(false); // Cannot castle queenside
  });

  it('should not allow castling when the king would end up in check', () => {
     // Setup: Kingside castling blocked by attack on g1 (Black Rook g2)
     model.importFEN('r3k2r/8/8/8/8/8/6r1/R3K2R w KQkq - 0 1'); // Path is clear
     model.board[7][5] = null; model.board[7][6] = null; // Clear f1, g1
     expect(model.isSquareAttacked(7, 6, 'black')).toBe(true); // g1 is attacked
     expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside
  });

  // --- En Passant ---
  it('should make en passant available only immediately after a pawn\'s double move', () => {
    // 1. e4
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
    expect(model.enPassantTarget).toEqual({ row: 5, col: 4 });

    // 1... Nc6 (Some other move, not using en passant)
    model.makeMove({ row: 0, col: 1 }, { row: 2, col: 2 });
    expect(model.enPassantTarget).toBeNull(); // En passant target should be cleared

    // 2. d4
    model.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 });
    expect(model.enPassantTarget).toEqual({ row: 5, col: 3 }); // New target set

     // 2... d5 (Black pawn double move)
    model.makeMove({ row: 1, col: 3 }, { row: 3, col: 3 });
    expect(model.enPassantTarget).toEqual({ row: 2, col: 3 }); // Black's move sets target

    // 3. Nc3 (White does not capture en passant)
    model.makeMove({ row: 7, col: 1 }, { row: 5, col: 2 });
    expect(model.enPassantTarget).toBeNull(); // En passant target cleared again

    // Black pawn at d5 cannot be captured en passant anymore by white pawn at e4
    const whitePawnMoves = model.getValidMoves(4, 4); // Moves for white pawn at e4
    const canCaptureEP = whitePawnMoves.some(m => m.to.row === 2 && m.to.col === 3 && m.specialMove?.type === 'enPassant');
    expect(canCaptureEP).toBe(false);
  });

  it('should remove the correct pawn from the board during en passant capture', () => {
    // Setup: White pawn e5, Black pawn d7. Black plays d5. En passant available.
    model.importFEN('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    model.currentPlayer = 'white';
    model.enPassantTarget = { row: 2, col: 3 }; // Manually set based on FEN

    expect(model.board[3][3]?.type).toBe('pawn'); // Black pawn at d5 exists
    expect(model.board[3][3]?.color).toBe('black');

    // White captures en passant: exd6
    const success = model.makeMove({ row: 3, col: 4 }, { row: 2, col: 3 }); // e5 pawn captures d6 (en passant)

    expect(success).toBe(true);
    expect(model.board[2][3]?.type).toBe('pawn');   // White pawn moved to d6
    expect(model.board[3][3]).toBeNull();           // Black pawn at d5 was removed
    expect(model.board[3][4]).toBeNull();           // White pawn original square is empty
  });

  it('should only be possible for pawns on the 5th rank (white) or 4th rank (black) to capture en passant', () => {
    // White pawn must be on rank 5 (index 3) to capture en passant on rank 6 (index 2)
    // Black pawn must be on rank 4 (index 4) to capture en passant on rank 3 (index 5)

    // Test white: Setup W pawn e5, B pawn d7 -> d5. White can capture.
    model.importFEN('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    model.currentPlayer = 'white';
    model.enPassantTarget = { row: 2, col: 3 };
    const whiteMoves = model.getValidMoves(3, 4); // White pawn at e5 (index 3)
    expect(whiteMoves.some(m => m.specialMove?.type === 'enPassant')).toBe(true);

    // Test black: Setup B pawn d4, W pawn e2 -> e4. Black can capture.
    model.importFEN('rnbqkbnr/pppp1ppp/8/8/3p4/8/PPP1PPPP/RNBQKBNR b KQkq e3 0 1');
    model.makeMove({row: 6, col: 4}, {row: 4, col: 4}); // 1. e4
    model.currentPlayer = 'black';
    model.enPassantTarget = { row: 5, col: 4 }; // en passant target for black pawn at d4 is e3 (index 5, col 4)
    const blackMoves = model.getValidMoves(4, 3); // Black pawn at d4 (index 4)
    expect(blackMoves.some(m => m.specialMove?.type === 'enPassant')).toBe(true);

    // Test invalid rank: Setup W pawn e4, B pawn d7 -> d5. White pawn e4 cannot capture.
    model.importFEN('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    model.currentPlayer = 'white';
    model.enPassantTarget = { row: 2, col: 3 };
    const whiteMovesInvalid = model.getValidMoves(4, 4); // White pawn at e4 (index 4)
    expect(whiteMovesInvalid.some(m => m.specialMove?.type === 'enPassant')).toBe(false);
  });


  // --- Pawn Promotion ---
  it('should trigger pawn promotion when a pawn reaches the opponent\'s back rank', () => {
    // White pawn to 8th rank
    model.importFEN('k7/4P3/8/8/8/8/8/K7 w - - 0 1');
    const whiteMoves = model.getValidMoves(1, 4); // White Pawn at e7
    expect(whiteMoves.length).toBe(4); // Should have 4 promotion moves (Q, R, B, N)
    expect(whiteMoves.every(m => m.specialMove?.type === 'pawnPromotion')).toBe(true);
    expect(whiteMoves.every(m => m.to.row === 0 && m.to.col === 4)).toBe(true);

    // Black pawn to 1st rank
    model.importFEN('k7/8/8/8/8/8/4p3/K7 b - - 0 1');
    const blackMoves = model.getValidMoves(6, 4); // Black Pawn at e2
    expect(blackMoves.length).toBe(4); // Should have 4 promotion moves
    expect(blackMoves.every(m => m.specialMove?.type === 'pawnPromotion')).toBe(true);
    expect(blackMoves.every(m => m.to.row === 7 && m.to.col === 4)).toBe(true);
  });

  it('should allow promotion to queen, rook, bishop, or knight', () => {
    model.importFEN('k7/4P3/8/8/8/8/8/K7 w - - 0 1');
    const from = { row: 1, col: 4 };
    const to = { row: 0, col: 4 };

    // Queen (default)
    model.makeMove(from, to);
    expect(model.board[to.row][to.col]?.type).toBe('queen');
    model.undoMove();

    // Rook
    model.makeMove(from, to, 'rook');
    expect(model.board[to.row][to.col]?.type).toBe('rook');
    model.undoMove();

    // Bishop
    model.makeMove(from, to, 'bishop');
    expect(model.board[to.row][to.col]?.type).toBe('bishop');
    model.undoMove();

    // Knight
    model.makeMove(from, to, 'knight');
    expect(model.board[to.row][to.col]?.type).toBe('knight');
  });

  it('should work correctly when capturing on the promotion square', () => {
    // White pawn e7, Black rook d8. White captures exd8=Q.
    model.importFEN('3r4/4P3/k7/8/8/8/8/K7 w - - 0 1');
    const from = { row: 1, col: 4 }; // e7
    const to = { row: 0, col: 3 };   // d8
    expect(model.board[to.row][to.col]?.type).toBe('rook');

    const success = model.makeMove(from, to, 'queen');
    expect(success).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('queen');
    expect(model.board[to.row][to.col]?.color).toBe('white');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  // --- Castling Rights Update ---
  it('should update castling rights correctly after king or rook movements', () => {
    // Initial state
    expect(model.castlingRights.white.kingSide).toBe(true);
    expect(model.castlingRights.white.queenSide).toBe(true);
    expect(model.castlingRights.black.kingSide).toBe(true);
    expect(model.castlingRights.black.queenSide).toBe(true);

    // Move White King
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // e5
    model.makeMove({ row: 7, col: 4 }, { row: 6, col: 4 }); // Ke2
    expect(model.castlingRights.white.kingSide).toBe(false);
    expect(model.castlingRights.white.queenSide).toBe(false);
    expect(model.castlingRights.black.kingSide).toBe(true); // Black rights unaffected
    expect(model.castlingRights.black.queenSide).toBe(true);

    // Move Black Kingside Rook
    model.makeMove({ row: 0, col: 7 }, { row: 2, col: 7 }); // Rh6
    expect(model.castlingRights.black.kingSide).toBe(false);
    expect(model.castlingRights.black.queenSide).toBe(true); // Queenside unaffected

    // Move White Queenside Rook
    model.reset(); // Reset for clean test
    model.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // a4
    model.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5
    model.makeMove({ row: 7, col: 0 }, { row: 5, col: 0 }); // Ra3
    expect(model.castlingRights.white.kingSide).toBe(true); // Kingside unaffected
    expect(model.castlingRights.white.queenSide).toBe(false);
  });

});
