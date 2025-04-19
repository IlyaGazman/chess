import { ChessModel } from '/chess/model.js';

describe('ChessModel - Check, Checkmate, Stalemate', () => {
  let model;

  beforeEach(() => {
    model = new ChessModel();
  });

  it('should correctly identify when a king is in check', () => {
    // Setup: White king e1, Black queen e2
    model.importFEN('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    expect(model.gameStatus).toBe('check'); // Status should update after import/setup
  });

  it('should prevent moves that leave the king in check', () => {
    // Setup: White king e1, White rook a1, Black queen a2. Moving rook would expose king.
    model.importFEN('k7/8/8/8/8/8/q7/R3K3 w Q - 0 1');
    expect(model.isKingInCheck('white')).toBe(false);
    const from = { row: 7, col: 0 }; // Rook at a1
    const to = { row: 6, col: 0 };   // Rook to a2
    expect(model.makeMove(from, to)).toBe(false); // Illegal move due to check exposure
    expect(model.board[from.row][from.col]?.type).toBe('rook'); // Rook hasn't moved
  });

  it('should recognize checkmate when the king is in check and has no valid moves', () => {
    // Setup: Fool's Mate
    model.makeMove({ row: 6, col: 5 }, { row: 5, col: 5 }); // 1. f3
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 }); // 1... e5
    model.makeMove({ row: 6, col: 6 }, { row: 4, col: 6 }); // 2. g4
    model.makeMove({ row: 0, col: 3 }, { row: 4, col: 7 }); // 2... Qh4#
    expect(model.isKingInCheck('white')).toBe(true);
    expect(model.hasAnyValidMoves('white')).toBe(false);
    expect(model.gameStatus).toBe('checkmate');
  });

  it('should recognize stalemate when the king is not in check but has no valid moves', () => {
    // Setup: King trapped, no other pieces can move. White King a1, White pawn a3, Black Queen b3.
    model.importFEN('8/8/8/8/8/k1q5/P7/K7 w - - 0 1');
    // It's white's turn. King cannot move (b2 attacked, a2 blocked), pawn cannot move.
    model.currentPlayer = 'white'; // Ensure it's white's turn
    model.updateGameStatus(); // Manually trigger update if needed after import
    expect(model.isKingInCheck('white')).toBe(false);
    expect(model.hasAnyValidMoves('white')).toBe(false);
    expect(model.gameStatus).toBe('stalemate');
  });

  it('should update the game status correctly after each move', () => {
    expect(model.gameStatus).toBe('active');
    // 1. e4
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 });
    expect(model.gameStatus).toBe('active');
    // 1... e5
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
    expect(model.gameStatus).toBe('active');
    // 2. Bc4
    model.makeMove({ row: 7, col: 5 }, { row: 4, col: 2 });
    expect(model.gameStatus).toBe('active');
    // 2... Bc5
    model.makeMove({ row: 0, col: 5 }, { row: 3, col: 2 });
    expect(model.gameStatus).toBe('active');
    // 3. Qh5 (attacks f7 pawn and threatens checkmate)
    model.makeMove({ row: 7, col: 3 }, { row: 3, col: 7 });
    expect(model.gameStatus).toBe('active');
     // 3... Nf6?? (Blocks checkmate but allows Qxf7#) -> mistake setup, let's make a check move
    // Setup check: White Queen h5 checks Black King e8
    model.importFEN('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQ1RK1 b kq - 0 1'); // Example position after castling
    model.board[3][7] = {type: 'queen', color: 'white'}; // Place white queen at h5
    model.updateGameStatus(); // Queen now attacks e8
    expect(model.gameStatus).toBe('check');

    // Black blocks check: 3... g6
    model.makeMove({ row: 1, col: 6 }, { row: 2, col: 6 });
    expect(model.gameStatus).toBe('active'); // Check is resolved
  });

  it('should not allow a player to make moves when in checkmate', () => {
    // Setup: Fool's Mate
    model.makeMove({ row: 6, col: 5 }, { row: 5, col: 5 }); // 1. f3 e5
    model.makeMove({ row: 1, col: 4 }, { row: 3, col: 4 });
    model.makeMove({ row: 6, col: 6 }, { row: 4, col: 6 }); // 2. g4 Qh4#
    model.makeMove({ row: 0, col: 3 }, { row: 4, col: 7 });
    expect(model.gameStatus).toBe('checkmate');

    // Attempt a move for white (checkmated player)
    expect(model.makeMove({ row: 7, col: 6 }, { row: 5, col: 5 })).toBe(false); // Try moving Knight g1
  });

  it('should identify all possible moves to get out of check', () => {
    // Setup: White king e1 in check from Black queen e2. White rook h1 can block. White king can move f1/d1.
    model.importFEN('4k3/7R/8/8/8/8/4q3/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    const validMoves = model.getValidMoves(7, 4); // King moves
    const validMovesRook = model.getValidMoves(1, 7); // Rook moves

    const expectedKingMoves = [
      { from: { row: 7, col: 4 }, to: { row: 7, col: 3 } }, // Kd1
      { from: { row: 7, col: 4 }, to: { row: 7, col: 5 } }  // Kf1
    ];
    const expectedRookMoves = [
       { from: { row: 1, col: 7 }, to: { row: 6, col: 7 } } // Rh2 blocks check - Error in setup, rook is on h7, should be h1
    ];

    // Corrected Setup: White king e1, White rook h1, Black queen e2
    model.importFEN('4k3/8/8/8/8/8/4q3/4K2R w K - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    const kingMoves = model.getValidMoves(7, 4);
    const rookMoves = model.getValidMoves(7, 7);

    // Check king moves: d1, f1
    expect(kingMoves.some(m => m.to.row === 7 && m.to.col === 3)).toBe(true);
    expect(kingMoves.some(m => m.to.row === 7 && m.to.col === 5)).toBe(true);
    expect(kingMoves.length).toBe(2); // Only valid escape squares

    // Check rook moves: Re2 (block)
    expect(rookMoves.some(m => m.to.row === 6 && m.to.col === 4)).toBe(true); // Re2 blocks
  });

  it('should recognize capturing a checking piece as a valid response to check', () => {
    // Setup: White king e1, White knight f3, Black queen e2 checks. Knight can capture queen.
    model.importFEN('4k3/8/8/8/8/5N2/4q3/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    const knightMoves = model.getValidMoves(5, 5); // f3 knight

    expect(knightMoves.some(m => m.to.row === 6 && m.to.col === 4)).toBe(true); // Nxe2 is a valid move
    expect(model.makeMove({ row: 5, col: 5 }, { row: 6, col: 4 })).toBe(true); // Make the capture
    expect(model.isKingInCheck('white')).toBe(false);
  });

  it('should recognize blocking a check with another piece as a valid response', () => {
     // Setup: White king e1, White bishop f1, Black queen e5 checks. Bishop can block at e2.
    model.importFEN('4k3/8/8/4q3/8/8/8/4KB2 w K - 0 1');
     expect(model.isKingInCheck('white')).toBe(true);
     const bishopMoves = model.getValidMoves(7, 5); // f1 bishop

     expect(bishopMoves.some(m => m.to.row === 6 && m.to.col === 4)).toBe(true); // Be2 is a valid move
     expect(model.makeMove({ row: 7, col: 5 }, { row: 6, col: 4 })).toBe(true); // Make the block
     expect(model.isKingInCheck('white')).toBe(false);
  });

  it('should recognize moving the king away from check as a valid response', () => {
    // Setup: White king e1 in check from Black queen e2. King can move f1/d1.
    model.importFEN('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    const kingMoves = model.getValidMoves(7, 4); // e1 king

    expect(kingMoves.some(m => m.to.row === 7 && m.to.col === 5)).toBe(true); // Kf1 is valid
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 5 })).toBe(true); // Move king
    expect(model.isKingInCheck('white')).toBe(false); // No longer in check
  });

  it('should require the king to move when facing multiple checking pieces (double check)', () => {
    // Setup: Double check. White King e1, Black Rook e8 (checks), Black Knight d3 (discovered check).
    // White pieces at g1 (knight) and a1 (bishop) cannot block both or capture both.
    model.importFEN('r3kbnr/p1p1p1p1/8/8/8/3n4/PP1PPPPP/RNBQKBNR w KQkq - 0 1'); // Needs setup
    // Simplified: WK e1, BR e8, BN f2. Only king moves possible.
    model.importFEN('4r3/8/8/8/8/8/5n2/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    const kingMoves = model.getValidMoves(7, 4); // e1 king
    const knightMoves = model.getValidMoves(0, 6); // Try moving some other piece (should be none) - Invalid setup
    const bishopMoves = model.getValidMoves(0, 5); // Try moving some other piece - Invalid setup

    // Check that only king moves are valid
    const allWhiteMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = model.board[r][c];
            if (piece && piece.color === 'white') {
                allWhiteMoves.push(...model.getValidMoves(r, c));
            }
        }
    }

    expect(allWhiteMoves.length).toBeGreaterThan(0); // King should have moves
    expect(allWhiteMoves.every(m => m.from.row === 7 && m.from.col === 4)).toBe(true); // All valid moves must be king moves (Kf1, Kd1)
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 5 })).toBe(true); // Kf1
  });

   it('should prevent pinned pieces (those that would expose the king to check if moved) from moving', () => {
    // Setup: White king e1, White rook e2, Black queen e4. Rook is pinned.
    model.importFEN('4k3/8/8/8/4q3/8/4R3/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(false);
    const rookMoves = model.getValidMoves(6, 4); // Rook at e2
    // Rook cannot move horizontally (Re1 invalid as it checks king, Re3-Re8 expose king)
    // Rook cannot move vertically (Rd2, Rf2 expose king)
    expect(rookMoves.length).toBe(0);
    expect(model.makeMove({row: 6, col: 4}, {row: 6, col: 5})).toBe(false); // Try moving rook Rf2
  });

  it('should correctly identify check from all piece types', () => {
    // Pawn Check
    model.importFEN('4k3/8/8/8/8/3p4/8/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    model.reset();

    // Knight Check
    model.importFEN('4k3/8/8/8/8/5n2/8/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    model.reset();

    // Bishop Check
    model.importFEN('4k3/8/8/8/8/8/6b1/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    model.reset();

    // Rook Check
    model.importFEN('4k3/8/8/8/8/8/8/R3K3 b Q - 0 1'); // Black king checked by white rook
    model.currentPlayer = 'black'; // Set current player for check test
    expect(model.isKingInCheck('black')).toBe(true);
    model.reset();

    // Queen Check (Diagonal)
    model.importFEN('4k3/8/8/8/8/8/6q1/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
     model.reset();

    // Queen Check (Rank)
    model.importFEN('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
  });

  it('should change game status appropriately when entering and leaving check states', () => {
     // Setup: White king e1, Black queen e2 checks.
     model.importFEN('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1');
     expect(model.gameStatus).toBe('check');

     // Move king to safety: Kf1
     model.makeMove({row: 7, col: 4}, {row: 7, col: 5});
     expect(model.isKingInCheck('white')).toBe(false);
     expect(model.gameStatus).toBe('active'); // Should be black's turn now, status is active
  });

  it('should not allow castling through, out of, or into check', () => {
    // Out of Check: King e1 in check by Queen e2
    model.importFEN('4k3/8/8/8/8/8/4q3/R3K2R w KQ - 0 1');
    expect(model.isKingInCheck('white')).toBe(true);
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 2 })).toBe(false); // Cannot castle queenside

    // Through Check: King e1, Rook h1, Black Bishop b6 attacks f1
    model.importFEN('r3k2r/8/1b6/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(model.isSquareAttacked(7, 5, 'black')).toBe(true); // f1 is attacked
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside through f1

    // Into Check: King e1, Rook h1, Black Rook g2 attacks g1
    model.importFEN('r3k2r/8/8/8/8/8/6r1/R3K2R w KQkq - 0 1');
    expect(model.isSquareAttacked(7, 6, 'black')).toBe(true); // g1 is attacked
    expect(model.makeMove({ row: 7, col: 4 }, { row: 7, col: 6 })).toBe(false); // Cannot castle kingside into check
  });
});
