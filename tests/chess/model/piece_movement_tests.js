import { ChessModel } from '/chess/model.js';

describe('ChessModel - Piece Movement', () => {
  let model;

  beforeEach(() => {
    model = new ChessModel();
  });

  // --- Pawn Moves ---
  it('should allow pawns to move one square forward when the destination is empty', () => {
    const from = { row: 6, col: 4 }; // e2
    const to = { row: 5, col: 4 };   // e3
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('pawn');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  it('should allow pawns to move two squares forward from their starting position', () => {
    const from = { row: 6, col: 4 }; // e2
    const to = { row: 4, col: 4 };   // e4
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('pawn');
    expect(model.board[from.row][from.col]).toBeNull();
    expect(model.enPassantTarget).toEqual({ row: 5, col: 4 }); // En passant target set
  });

  it('should not allow pawns to move forward when blocked by another piece', () => {
    // Setup: Place a piece blocking the pawn
    model.board[5][4] = { type: 'pawn', color: 'black' }; // Black pawn at e3
    const from = { row: 6, col: 4 }; // e2
    const to1 = { row: 5, col: 4 };  // e3 (blocked)
    const to2 = { row: 4, col: 4 };  // e4 (blocked)
    expect(model.makeMove(from, to1)).toBe(false);
    expect(model.makeMove(from, to2)).toBe(false);
    expect(model.board[from.row][from.col]?.type).toBe('pawn'); // Pawn hasn't moved
  });

  it('should allow pawns to capture diagonally one square forward', () => {
    // Setup: Place an opponent piece diagonally
    model.board[5][5] = { type: 'pawn', color: 'black' }; // Black pawn at f3
    const from = { row: 6, col: 4 }; // e2
    const to = { row: 5, col: 5 };   // f3
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('pawn');
    expect(model.board[to.row][to.col]?.color).toBe('white');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  it('should not allow pawns to capture pieces directly in front of them', () => {
    // Setup: Place an opponent piece directly in front
    model.board[5][4] = { type: 'pawn', color: 'black' }; // Black pawn at e3
    const from = { row: 6, col: 4 }; // e2
    const to = { row: 5, col: 4 };   // e3
    expect(model.makeMove(from, to)).toBe(false);
    expect(model.board[from.row][from.col]?.type).toBe('pawn'); // Pawn hasn't moved
    expect(model.board[to.row][to.col]?.type).toBe('pawn');   // Black pawn still there
  });

  // --- Knight Moves ---
  it('should allow knights to move in an L-shape', () => {
    const from = { row: 7, col: 1 }; // b1
    const to = { row: 5, col: 2 };   // c3
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('knight');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  it('should allow knights to jump over other pieces', () => {
    // Knights start behind pawns, so their first move is a jump
    const from = { row: 7, col: 1 }; // b1
    const to = { row: 5, col: 0 };   // a3
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('knight');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  // --- Bishop Moves ---
  it('should allow bishops to move diagonally when the path is clear', () => {
    // Clear path for bishop: e4, then Bc4
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // 1. e4
    model.currentPlayer = 'white'; // Force white's turn again for test setup
    const from = { row: 7, col: 5 }; // f1
    const to = { row: 4, col: 2 };   // c4
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('bishop');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  it('should not allow bishops to move through other pieces', () => {
    const from = { row: 7, col: 5 }; // f1
    const to = { row: 4, col: 2 };   // c4 (blocked by pawn at e2)
    expect(model.makeMove(from, to)).toBe(false);
    expect(model.board[from.row][from.col]?.type).toBe('bishop'); // Bishop hasn't moved
  });

  // --- Rook Moves ---
  it('should allow rooks to move horizontally or vertically when the path is clear', () => {
    // Clear path for rook: a4, then Ra3
    model.makeMove({ row: 6, col: 0 }, { row: 4, col: 0 }); // 1. a4
    model.currentPlayer = 'white'; // Force white's turn again
    const from = { row: 7, col: 0 }; // a1
    const to = { row: 5, col: 0 };   // a3 (vertical)
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('rook');
    expect(model.board[from.row][from.col]).toBeNull();

    // Move horizontally
    const from2 = { row: 5, col: 0 }; // a3
    const to2 = { row: 5, col: 3 };   // d3
    model.currentPlayer = 'white'; // Force white's turn again
    expect(model.makeMove(from2, to2)).toBe(true);
    expect(model.board[to2.row][to2.col]?.type).toBe('rook');
    expect(model.board[from2.row][from2.col]).toBeNull();
  });

  it('should not allow rooks to move through other pieces', () => {
    const from = { row: 7, col: 0 }; // a1
    const to = { row: 5, col: 0 };   // a3 (blocked by pawn at a2)
    expect(model.makeMove(from, to)).toBe(false);
    expect(model.board[from.row][from.col]?.type).toBe('rook'); // Rook hasn't moved
  });

  // --- Queen Moves ---
  it('should allow queens to move diagonally, horizontally, or vertically when the path is clear', () => {
    // Clear path for queen: d4, then Qd3
    model.makeMove({ row: 6, col: 3 }, { row: 4, col: 3 }); // 1. d4
    model.currentPlayer = 'white'; // Force white's turn again
    const from = { row: 7, col: 3 }; // d1
    const to = { row: 5, col: 3 };   // d3 (vertical)
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('queen');
    expect(model.board[from.row][from.col]).toBeNull();

    // Move diagonally
    const from2 = { row: 5, col: 3 }; // d3
    const to2 = { row: 2, col: 6 };   // g6
    model.currentPlayer = 'white'; // Force white's turn again
    expect(model.makeMove(from2, to2)).toBe(true);
    expect(model.board[to2.row][to2.col]?.type).toBe('queen');
    expect(model.board[from2.row][from2.col]).toBeNull();
  });

  it('should not allow queens to move through other pieces', () => {
    const from = { row: 7, col: 3 }; // d1
    const to = { row: 4, col: 3 };   // d4 (blocked by pawn at d2)
    expect(model.makeMove(from, to)).toBe(false);
    expect(model.board[from.row][from.col]?.type).toBe('queen'); // Queen hasn't moved
  });

  // --- King Moves ---
  it('should allow kings to move one square in any direction', () => {
    // Clear path for king: e4, then Ke2
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // 1. e4
    model.currentPlayer = 'white'; // Force white's turn again
    const from = { row: 7, col: 4 }; // e1
    const to = { row: 6, col: 4 };   // e2
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('king');
    expect(model.board[from.row][from.col]).toBeNull();
  });

  // --- General Rules ---
  it('should not allow pieces to move off the board', () => {
    const from = { row: 7, col: 0 }; // a1 (Rook)
    const moves = model.getValidMoves(from.row, from.col);
    const offBoardMove = moves.find(m => m.to.row < 0 || m.to.row > 7 || m.to.col < 0 || m.to.col > 7);
    expect(offBoardMove).toBeUndefined();
    // Also check edge pawn
    const fromPawn = { row: 6, col: 0 }; // a2
    const movesPawn = model.getValidMoves(fromPawn.row, fromPawn.col);
    const offBoardMovePawn = movesPawn.find(m => m.to.col === -1);
     expect(offBoardMovePawn).toBeUndefined();
  });

  it('should allow pieces to capture opponent pieces but not friendly pieces', () => {
    // Setup: Place friendly piece at e3, opponent at f3
    model.board[5][4] = { type: 'pawn', color: 'white' }; // White pawn at e3
    model.board[5][5] = { type: 'pawn', color: 'black' }; // Black pawn at f3
    const from = { row: 6, col: 4 }; // e2

    // Attempt capture friendly piece at e3 (forward move blocked anyway)
    expect(model.makeMove(from, { row: 5, col: 4 })).toBe(false);

    // Attempt capture friendly piece at e3 diagonally (not a valid pawn move)
    // Instead, test with Knight capturing friendly piece
    model.board[5][2] = { type: 'pawn', color: 'white' }; // White pawn at c3
    const fromKnight = { row: 7, col: 1 }; // b1
    expect(model.makeMove(fromKnight, { row: 5, col: 2 })).toBe(false); // Cannot capture c3

    // Capture opponent piece at f3
    expect(model.makeMove(from, { row: 5, col: 5 })).toBe(true);
    expect(model.board[5][5]?.color).toBe('white');
  });

  it('should update the "moved" property correctly after a piece moves', () => {
    const pawn = model.board[6][4]; // e2 pawn
    const king = model.board[7][4]; // e1 king
    const rook = model.board[7][7]; // h1 rook
    expect(pawn.moved).toBe(false);
    expect(king.moved).toBe(false);
    expect(rook.moved).toBe(false);

    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
    expect(model.board[4][4].moved).toBe(true);

    // Black moves (to switch player)
    model.makeMove({ row: 1, col: 0 }, { row: 3, col: 0 }); // a5

    // Move king
    model.makeMove({ row: 7, col: 4 }, { row: 6, col: 4 }); // Ke2
    expect(model.board[6][4].moved).toBe(true);

    // Black moves
    model.makeMove({ row: 0, col: 1 }, { row: 2, col: 2 }); // Nc6

    // Move rook (requires pawn move first)
    model.makeMove({ row: 6, col: 7 }, { row: 5, col: 7 }); // h3
    model.makeMove({ row: 1, col: 1 }, { row: 2, col: 1 }); // b6 (dummy black move)
    model.makeMove({ row: 7, col: 7 }, { row: 6, col: 7 }); // Rh2
    expect(model.board[6][7].moved).toBe(true);
  });

  it('should handle rook movement correctly during castling', () => {
    // Setup for kingside castling
    model.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    model.board[7][5] = null; // Clear f1
    model.board[7][6] = null; // Clear g1
    model.castlingRights.white.kingSide = true;

    const from = { row: 7, col: 4 }; // e1
    const to = { row: 7, col: 6 };   // g1
    const success = model.makeMove(from, to);

    expect(success).toBe(true);
    expect(model.board[7][6]?.type).toBe('king');
    expect(model.board[7][5]?.type).toBe('rook'); // Rook moved to f1
    expect(model.board[7][7]).toBeNull();         // Rook no longer at h1
  });

  it('should handle pawn promotion correctly when reaching the opponent\'s back rank', () => {
    // Setup: White pawn at e7, black king at a8 for validity
    model.importFEN('k7/4P3/8/8/8/8/8/K7 w - - 0 1');
    const from = { row: 1, col: 4 }; // e7 (index 1 because FEN row 7 is board index 1)
    const to = { row: 0, col: 4 };   // e8

    // Promote to Queen (default)
    expect(model.makeMove(from, to)).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('queen');
    expect(model.board[to.row][to.col]?.color).toBe('white');
    expect(model.board[from.row][from.col]).toBeNull();

    // Reset and promote to Knight
    model.importFEN('k7/4P3/8/8/8/8/8/K7 w - - 0 1');
    expect(model.makeMove(from, to, 'knight')).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('knight');
  });

  it('should handle en passant captures correctly', () => {
    // Setup: White pawn e5, Black pawn d7. Black plays d5.
    model.importFEN('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
    model.currentPlayer = 'white'; // Correct player based on FEN
    model.enPassantTarget = { row: 2, col: 3 }; // Set en passant target manually based on FEN


    const from = { row: 3, col: 4 }; // White pawn at e5 (index 3)
    const to = { row: 2, col: 3 };   // Target square d6 (index 2)

    expect(model.board[3][3]?.type).toBe('pawn'); // Black pawn at d5 to be captured
    expect(model.enPassantTarget).toEqual({ row: 2, col: 3 });

    const success = model.makeMove(from, to);

    expect(success).toBe(true);
    expect(model.board[to.row][to.col]?.type).toBe('pawn');   // White pawn moved to d6
    expect(model.board[to.row][to.col]?.color).toBe('white');
    expect(model.board[from.row][from.col]).toBeNull();       // Original square e5 is empty
    expect(model.board[3][3]).toBeNull();                     // Captured black pawn at d5 is removed
    expect(model.enPassantTarget).toBeNull();                 // En passant target is cleared
  });

});
