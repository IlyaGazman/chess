import { ChessModel } from '/chess/model.js';

describe('ChessModel - Board Initialization', () => {
  let model;

  beforeEach(() => {
    model = new ChessModel();
  });

  it('should create the chess board as an 8x8 grid', () => {
    expect(model.board.length).toBe(8);
    model.board.forEach(row => {
      expect(row.length).toBe(8);
    });
  });

  it('should position white pawns correctly on the 6th row (index 6)', () => {
    for (let col = 0; col < 8; col++) {
      const piece = model.board[6][col];
      expect(piece).toEqual({ type: 'pawn', color: 'white', moved: false });
    }
  });

  it('should position black pawns correctly on the 1st row (index 1)', () => {
    for (let col = 0; col < 8; col++) {
      const piece = model.board[1][col];
      expect(piece).toEqual({ type: 'pawn', color: 'black', moved: false });
    }
  });

  it('should position white pieces correctly on the 7th row (index 7)', () => {
    expect(model.board[7][0]).toEqual({ type: 'rook', color: 'white', moved: false });
    expect(model.board[7][1]).toEqual({ type: 'knight', color: 'white' });
    expect(model.board[7][2]).toEqual({ type: 'bishop', color: 'white' });
    expect(model.board[7][3]).toEqual({ type: 'queen', color: 'white' });
    expect(model.board[7][4]).toEqual({ type: 'king', color: 'white', moved: false });
    expect(model.board[7][5]).toEqual({ type: 'bishop', color: 'white' });
    expect(model.board[7][6]).toEqual({ type: 'knight', color: 'white' });
    expect(model.board[7][7]).toEqual({ type: 'rook', color: 'white', moved: false });
  });

  it('should position black pieces correctly on the 0th row (index 0)', () => {
    expect(model.board[0][0]).toEqual({ type: 'rook', color: 'black', moved: false });
    expect(model.board[0][1]).toEqual({ type: 'knight', color: 'black' });
    expect(model.board[0][2]).toEqual({ type: 'bishop', color: 'black' });
    expect(model.board[0][3]).toEqual({ type: 'queen', color: 'black' });
    expect(model.board[0][4]).toEqual({ type: 'king', color: 'black', moved: false });
    expect(model.board[0][5]).toEqual({ type: 'bishop', color: 'black' });
    expect(model.board[0][6]).toEqual({ type: 'knight', color: 'black' });
    expect(model.board[0][7]).toEqual({ type: 'rook', color: 'black', moved: false });
  });

  it('should ensure all pieces have correct initial properties', () => {
    // Sample checks (covered more specifically above, but this confirms general structure)
    const whitePawn = model.board[6][0];
    const blackKnight = model.board[0][1];
    const whiteKing = model.board[7][4];

    expect(whitePawn.type).toBe('pawn');
    expect(whitePawn.color).toBe('white');
    expect(whitePawn.moved).toBe(false);

    expect(blackKnight.type).toBe('knight');
    expect(blackKnight.color).toBe('black');
    expect(blackKnight.moved).toBeUndefined(); // Knights don't track moved status for castling

    expect(whiteKing.type).toBe('king');
    expect(whiteKing.color).toBe('white');
    expect(whiteKing.moved).toBe(false);
  });

  it('should return the board to the starting position after reset', () => {
    // Make a move
    model.makeMove({ row: 6, col: 4 }, { row: 4, col: 4 }); // e4
    expect(model.board[6][4]).toBeNull();
    expect(model.board[4][4]).toEqual({ type: 'pawn', color: 'white', moved: true });

    // Reset
    model.reset();

    // Verify starting position again
    expect(model.board[6][4]).toEqual({ type: 'pawn', color: 'white', moved: false });
    expect(model.board[4][4]).toBeNull();
    expect(model.currentPlayer).toBe('white');
    expect(model.moveHistory.length).toBe(0);
    expect(model.castlingRights.white.kingSide).toBe(true);
    expect(model.castlingRights.black.kingSide).toBe(true);
  });

  it('should initialize the board properly when creating a new instance', () => {
    // This is implicitly tested by all other tests using `new ChessModel()`
    // Explicitly check a few key properties of a new instance
    expect(model.currentPlayer).toBe('white');
    expect(model.gameStatus).toBe('active');
    expect(model.moveHistory).toEqual([]);
    expect(model.board[0][0].type).toBe('rook');
    expect(model.board[7][7].type).toBe('rook');
    expect(model.board[3][3]).toBeNull();
  });

  it('should ensure empty squares in the initialized board are null', () => {
    for (let row = 2; row < 6; row++) {
      for (let col = 0; col < 8; col++) {
        expect(model.board[row][col]).toBeNull();
      }
    }
  });

  it('should place kings in their correct starting positions (white at e1, black at e8)', () => {
    expect(model.board[7][4]).toEqual({ type: 'king', color: 'white', moved: false });
    expect(model.board[0][4]).toEqual({ type: 'king', color: 'black', moved: false });
  });

});
