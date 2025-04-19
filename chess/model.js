/**
 * Chess Game Model - ES6+ implementation with no dependencies
 */
export class ChessModel {
  constructor() {
    this.reset();
  }

  /**
   * Resets the chess game to its initial state
   */
  reset() {
    // Game state
    this.currentPlayer = 'white';
    this.moveHistory = [];
    this.gameStatus = 'active'; // active, check, checkmate, stalemate, draw
    this.halfMoveClock = 0; // For 50-move rule
    this.fullMoveNumber = 1; // Increments after black's move
    this.enPassantTarget = null; // Square behind a pawn that moved two squares
    this.castlingRights = {
      white: { kingSide: true, queenSide: true },
      black: { kingSide: true, queenSide: true }
    };

    // Initialize the board with pieces in their starting positions
    this.board = this.createEmptyBoard();
    this.setupInitialPosition();
  }

  /**
   * Creates an empty 8x8 chess board
   */
  createEmptyBoard() {
    const board = Array(8).fill().map(() => Array(8).fill(null));
    return board;
  }

  /**
   * Sets up the initial chess position
   */
  setupInitialPosition() {
    // Setup pawns
    for (let col = 0; col < 8; col++) {
      this.board[1][col] = { type: 'pawn', color: 'black', moved: false };
      this.board[6][col] = { type: 'pawn', color: 'white', moved: false };
    }

    // Setup rooks
    this.board[0][0] = { type: 'rook', color: 'black', moved: false };
    this.board[0][7] = { type: 'rook', color: 'black', moved: false };
    this.board[7][0] = { type: 'rook', color: 'white', moved: false };
    this.board[7][7] = { type: 'rook', color: 'white', moved: false };

    // Setup knights
    this.board[0][1] = { type: 'knight', color: 'black' };
    this.board[0][6] = { type: 'knight', color: 'black' };
    this.board[7][1] = { type: 'knight', color: 'white' };
    this.board[7][6] = { type: 'knight', color: 'white' };

    // Setup bishops
    this.board[0][2] = { type: 'bishop', color: 'black' };
    this.board[0][5] = { type: 'bishop', color: 'black' };
    this.board[7][2] = { type: 'bishop', color: 'white' };
    this.board[7][5] = { type: 'bishop', color: 'white' };

    // Setup queens
    this.board[0][3] = { type: 'queen', color: 'black' };
    this.board[7][3] = { type: 'queen', color: 'white' };

    // Setup kings
    this.board[0][4] = { type: 'king', color: 'black', moved: false };
    this.board[7][4] = { type: 'king', color: 'white', moved: false };
  }

  /**
   * Makes a move on the chess board if it's valid
   * @param {Object} from - Starting position {row, col}
   * @param {Object} to - Ending position {row, col}
   * @param {string} promotion - Optional piece type for pawn promotion
   * @returns {boolean} - Whether the move was successful
   */
  makeMove(from, to, promotion = null) {
    if (this.gameStatus !== 'active' && this.gameStatus !== 'check') return false;
    const validMoves = this.getValidMoves(from.row, from.col);
    const targetMove = validMoves.find(move => 
      move.to.row === to.row && move.to.col === to.col && 
      (!move.promotion || move.promotion === promotion)
    );
    if (!targetMove) return false;
    this.executeMove(targetMove, promotion);
    return true;
  }

  /**
   * Executes a chess move that has been validated
   * @param {Object} move - The move to execute
   * @param {string} promotion - Piece type for promotion
   */
  executeMove(move, promotion) {
    const { from, to, specialMove } = move;
    const movingPiece = this.board[from.row][from.col];
    const capturedPiece = this.board[to.row][to.col];

    // Update halfmove clock for 50-move rule
    if (movingPiece.type === 'pawn' || !!capturedPiece || (specialMove && specialMove.type === 'enPassant')) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    // Update fullmove number
    if (this.currentPlayer === 'black') {
      this.fullMoveNumber++;
    }

    // Cache values for move history
    const oldEnPassantTarget = this.enPassantTarget
      ? { row: this.enPassantTarget.row, col: this.enPassantTarget.col }
      : null;
    const oldCastlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    const oldHalfMoveClock = this.halfMoveClock;
    const oldFullMoveNumber = this.fullMoveNumber;

    // Clear en passant target (will set anew for double pawn advance)
    this.enPassantTarget = null;

    // Handle special moves
    if (specialMove) {
      switch (specialMove.type) {
        case 'castling': {
          // Move the rook
          const rook = this.board[specialMove.rookFrom.row][specialMove.rookFrom.col];
          this.board[specialMove.rookTo.row][specialMove.rookTo.col] = rook;
          this.board[specialMove.rookFrom.row][specialMove.rookFrom.col] = null;
          if (rook && typeof rook.moved !== 'undefined') rook.moved = true;
          break;
        }
        case 'enPassant': {
          // Remove the captured pawn
          this.board[specialMove.capturedPawn.row][specialMove.capturedPawn.col] = null;
          break;
        }
        case 'pawnPromotion':
          // handled below
          break;
      }
    }

    // Update castling rights
    if (movingPiece.type === 'king') {
      this.castlingRights[movingPiece.color].kingSide = false;
      this.castlingRights[movingPiece.color].queenSide = false;
    } else if (movingPiece.type === 'rook') {
      if (from.col === 0 && from.row === (movingPiece.color === 'white' ? 7 : 0)) {
        this.castlingRights[movingPiece.color].queenSide = false;
      } else if (from.col === 7 && from.row === (movingPiece.color === 'white' ? 7 : 0)) {
        this.castlingRights[movingPiece.color].kingSide = false;
      }
    }
    // If a rook is captured, lose castling rights for that rook for opponent
    if (capturedPiece && capturedPiece.type === 'rook') {
      if (to.col === 0 && to.row === 0) this.castlingRights.black.queenSide = false;
      if (to.col === 7 && to.row === 0) this.castlingRights.black.kingSide = false;
      if (to.col === 0 && to.row === 7) this.castlingRights.white.queenSide = false;
      if (to.col === 7 && to.row === 7) this.castlingRights.white.kingSide = false;
    }

    // Set en passant target if pawn moves two squares
    if (
      movingPiece.type === 'pawn' &&
      Math.abs(from.row - to.row) === 2
    ) {
      const direction = movingPiece.color === 'white' ? -1 : 1;
      this.enPassantTarget = { row: from.row + direction, col: from.col };
    }

    // Move the piece
    if (specialMove && specialMove.type === 'pawnPromotion') {
      this.board[to.row][to.col] = {
        type: promotion || move.promotion || 'queen',
        color: movingPiece.color
      };
    } else {
      this.board[to.row][to.col] = movingPiece;
    }

    this.board[from.row][from.col] = null;

    // Mark piece as moved for pieces that track this
    if (movingPiece.moved !== undefined) {
      movingPiece.moved = true;
    }

    // Add move to history
    this.moveHistory.push({
      piece: movingPiece.type,
      color: movingPiece.color,
      from,
      to,
      captured: capturedPiece ? capturedPiece.type : (specialMove && specialMove.type === 'enPassant' ? 'pawn' : null),
      capturedColor: capturedPiece
        ? capturedPiece.color
        : specialMove && specialMove.type === 'enPassant'
        ? movingPiece.color === 'white'
          ? 'black'
          : 'white'
        : null,
      promotion: promotion || move.promotion,
      specialMove: specialMove ? JSON.parse(JSON.stringify(specialMove)) : null,
      enPassantTarget: oldEnPassantTarget,
      castlingRights: oldCastlingRights,
      halfMoveClock: oldHalfMoveClock,
      fullMoveNumber: oldFullMoveNumber
    });

    // Switch player
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

    // Update game status
    this.updateGameStatus();

    return true;
  }

  /**
   * Updates the game status (check, checkmate, stalemate, etc.)
   */
  updateGameStatus() {
    if (this.gameStatus === 'draw' || this.gameStatus === 'checkmate' || this.gameStatus === 'stalemate') {
      return;
    }

    const inCheck = this.isKingInCheck(this.currentPlayer);
    const hasValidMoves = this.hasAnyValidMoves(this.currentPlayer);

    if (inCheck) {
      if (!hasValidMoves) {
        this.gameStatus = 'checkmate';
      } else {
        this.gameStatus = 'check';
      }
    } else if (!hasValidMoves) {
      this.gameStatus = 'stalemate';
    } else if (this.halfMoveClock >= 50) {
      this.gameStatus = 'draw'; // 50-move rule
    } else if (this.isInsufficientMaterial()) {
      this.gameStatus = 'draw'; // Insufficient material
    } else if (this.isThreefoldRepetition()) {
      this.gameStatus = 'draw'; // Threefold repetition
    } else {
      this.gameStatus = 'active';
    }
  }

  /**
   * Checks if a king is in check
   * @param {string} color - The color of the king to check
   * @returns {boolean} - Whether the king is in check
   */
  isKingInCheck(color) {
    // Find the king
    const kingPosition = this.findKing(color);
    if (!kingPosition) return false;

    // Check if any opponent piece can attack the king
    const opponentColor = color === 'white' ? 'black' : 'white';
    return this.isSquareAttacked(kingPosition.row, kingPosition.col, opponentColor);
  }

  /**
   * Finds the king of a given color
   * @param {string} color - Color of the king to find
   * @returns {Object|null} - Position of the king {row, col} or null if not found
   */
  findKing(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Checks if a square is under attack by a given color
   * @param {number} row - Row of the square
   * @param {number} col - Column of the square
   * @param {string} attackerColor - Color of the potential attacker
   * @returns {boolean} - Whether the square is under attack
   */
  isSquareAttacked(row, col, attackerColor) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === attackerColor) {
          const moves = this.getPieceMoves(r, c, true);
          if (moves.some(move => move.to.row === row && move.to.col === col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Gets all valid moves for a piece at a specific position
   * @param {number} row - Row of the piece
   * @param {number} col - Column of the piece
   * @returns {Array} - Array of valid moves
   */
  getValidMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];

    if (
      piece.color !== this.currentPlayer ||
      this.gameStatus === 'checkmate' ||
      this.gameStatus === 'stalemate' ||
      this.gameStatus === 'draw'
    )
      return [];

    const moves = this.getPieceMoves(row, col);
    return this.filterMovesForCheck(moves, piece.color);
  }

  /**
   * Filters moves that would leave the king in check
   * @param {Array} moves - List of candidate moves
   * @param {string} color - Color of the player making the move
   * @returns {Array} - Filtered list of valid moves
   */
  filterMovesForCheck(moves, color) {
    return moves.filter(move => {
      // Save full board state
      const boardBefore = this.cloneBoard();
      const moveHistoryBefore = JSON.parse(JSON.stringify(this.moveHistory));
      const enPassantTargetBefore = this.enPassantTarget
        ? { ...this.enPassantTarget }
        : null;
      const castlingRightsBefore = JSON.parse(JSON.stringify(this.castlingRights));
      const halfMoveClockBefore = this.halfMoveClock;
      const fullMoveNumberBefore = this.fullMoveNumber;
      const currentPlayerBefore = this.currentPlayer;
      const gameStatusBefore = this.gameStatus;

      let valid = true;
      // Simulate the move
      this._applyMoveForFilter(move);

      // Check if player would be in check after move
      valid = !this.isKingInCheck(color);

      // Restore board state
      this.board = boardBefore;
      this.moveHistory = moveHistoryBefore;
      this.enPassantTarget = enPassantTargetBefore;
      this.castlingRights = castlingRightsBefore;
      this.halfMoveClock = halfMoveClockBefore;
      this.fullMoveNumber = fullMoveNumberBefore;
      this.currentPlayer = currentPlayerBefore;
      this.gameStatus = gameStatusBefore;

      return valid;
    });
  }

  /*
   * Apply a move on the board for the purpose of getValidMoves filter (DO NOT push to moveHistory)
   * This is a local function, not a real move!
   */
  _applyMoveForFilter(move) {
    const { from, to, specialMove, promotion } = move;
    const movingPiece = this.board[from.row][from.col];
    const targetPiece = this.board[to.row][to.col];

    // Handle special moves
    if (specialMove && specialMove.type === 'castling') {
      // Rook moves
      const rook = this.board[specialMove.rookFrom.row][specialMove.rookFrom.col];
      this.board[specialMove.rookTo.row][specialMove.rookTo.col] = rook;
      this.board[specialMove.rookFrom.row][specialMove.rookFrom.col] = null;
    }
    if (specialMove && specialMove.type === 'enPassant') {
      // Remove captured pawn
      this.board[specialMove.capturedPawn.row][specialMove.capturedPawn.col] = null;
    }
    // Main move or promotion
    if (specialMove && specialMove.type === 'pawnPromotion') {
      this.board[to.row][to.col] = { type: promotion || 'queen', color: movingPiece.color };
    } else {
      this.board[to.row][to.col] = movingPiece;
    }
    this.board[from.row][from.col] = null;
    // The caller will restore the board after this
  }

  /**
   * Gets all possible moves for a piece without checking if they leave the king in check
   * @param {number} row - Row of the piece
   * @param {number} col - Column of the piece
   * @param {boolean} attackOnly - If true, only considers attack paths
   * @returns {Array} - Array of possible moves
   */
  getPieceMoves(row, col, attackOnly = false) {
    const piece = this.board[row][col];
    if (!piece) return [];

    const moves = [];

    switch (piece.type) {
      case 'pawn':
        this.getPawnMoves(row, col, piece.color, moves, attackOnly);
        break;
      case 'knight':
        this.getKnightMoves(row, col, piece.color, moves);
        break;
      case 'bishop':
        this.getBishopMoves(row, col, piece.color, moves);
        break;
      case 'rook':
        this.getRookMoves(row, col, piece.color, moves);
        break;
      case 'queen':
        this.getQueenMoves(row, col, piece.color, moves);
        break;
      case 'king':
        this.getKingMoves(row, col, piece.color, moves, attackOnly);
        break;
    }

    return moves;
  }

  /**
   * Gets all possible pawn moves
   * @param {number} row - Row of the pawn
   * @param {number} col - Column of the pawn
   * @param {string} color - Color of the pawn
   * @param {Array} moves - Array to store valid moves
   * @param {boolean} attackOnly - If true, only considers attack paths
   */
  getPawnMoves(row, col, color, moves, attackOnly = false) {
    const direction = color === 'white' ? -1 : 1;
    const startingRow = color === 'white' ? 6 : 1;
    const promotionRow = color === 'white' ? 0 : 7;

    // Forward moves
    if (!attackOnly) {
      // Single square forward
      if (this.isSquareEmpty(row + direction, col)) {
        if (row + direction === promotionRow) {
          // Pawn promotion
          ['queen', 'rook', 'bishop', 'knight'].forEach(promotionPiece => {
            moves.push({
              from: { row, col },
              to: { row: row + direction, col },
              specialMove: { type: 'pawnPromotion' },
              promotion: promotionPiece
            });
          });
        } else {
          moves.push({
            from: { row, col },
            to: { row: row + direction, col }
          });
        }

        // Double square forward from starting position
        if (
          row === startingRow &&
          this.isSquareEmpty(row + 2 * direction, col) &&
          this.isSquareEmpty(row + direction, col)
        ) {
          moves.push({
            from: { row, col },
            to: { row: row + 2 * direction, col }
          });
        }
      }
    }

    // Captures (including attack paths for attackOnly)
    for (const colOffset of [-1, 1]) {
      const targetCol = col + colOffset;
      if (targetCol < 0 || targetCol >= 8) continue;

      const targetRow = row + direction;
      const targetPiece = this.board[targetRow]?.[targetCol];

      // Regular capture
      if (targetPiece && targetPiece.color !== color) {
        if (targetRow === promotionRow) {
          // Promotion with capture
          ['queen', 'rook', 'bishop', 'knight'].forEach(promotionPiece => {
            moves.push({
              from: { row, col },
              to: { row: targetRow, col: targetCol },
              specialMove: { type: 'pawnPromotion' },
              promotion: promotionPiece
            });
          });
        } else {
          moves.push({
            from: { row, col },
            to: { row: targetRow, col: targetCol }
          });
        }
      }
      // Attack path for checking king
      else if (attackOnly) {
        moves.push({
          from: { row, col },
          to: { row: targetRow, col: targetCol }
        });
      }

      // En passant capture
      if (
        this.enPassantTarget &&
        targetRow === this.enPassantTarget.row &&
        targetCol === this.enPassantTarget.col
      ) {
        // Only allow for the correct color and correct pawn position
        if (!attackOnly) {
          moves.push({
            from: { row, col },
            to: { row: targetRow, col: targetCol },
            specialMove: {
              type: 'enPassant',
              capturedPawn: { row: row, col: targetCol }
            }
          });
        } else {
          moves.push({
            from: { row, col },
            to: { row: targetRow, col: targetCol }
          });
        }
      }
    }
  }

  /**
   * Gets all possible knight moves
   * @param {number} row - Row of the knight
   * @param {number} col - Column of the knight
   * @param {string} color - Color of the knight
   * @param {Array} moves - Array to store valid moves
   */
  getKnightMoves(row, col, color, moves) {
    const directions = [
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 }, { row: 1, col: 2 },
      { row: 2, col: -1 }, { row: 2, col: 1 }
    ];

    for (const dir of directions) {
      const targetRow = row + dir.row;
      const targetCol = col + dir.col;
      if (this.isSquareValidAndNotOccupiedByAlly(targetRow, targetCol, color)) {
        moves.push({
          from: { row, col },
          to: { row: targetRow, col: targetCol }
        });
      }
    }
  }

  /**
   * Gets all possible bishop moves
   * @param {number} row - Row of the bishop
   * @param {number} col - Column of the bishop
   * @param {string} color - Color of the bishop
   * @param {Array} moves - Array to store valid moves
   */
  getBishopMoves(row, col, color, moves) {
    const directions = [
      { row: -1, col: -1 }, // up-left
      { row: -1, col: 1 },  // up-right
      { row: 1, col: -1 },  // down-left
      { row: 1, col: 1 }    // down-right
    ];
    this.getSlidingMoves(row, col, color, moves, directions);
  }

  /**
   * Gets all possible rook moves
   * @param {number} row - Row of the rook
   * @param {number} col - Column of the rook
   * @param {string} color - Color of the rook
   * @param {Array} moves - Array to store valid moves
   */
  getRookMoves(row, col, color, moves) {
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 },  // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }   // right
    ];
    this.getSlidingMoves(row, col, color, moves, directions);
  }

  /**
   * Gets all possible queen moves
   * @param {number} row - Row of the queen
   * @param {number} col - Column of the queen
   * @param {string} color - Color of the queen
   * @param {Array} moves - Array to store valid moves
   */
  getQueenMoves(row, col, color, moves) {
    this.getBishopMoves(row, col, color, moves);
    this.getRookMoves(row, col, color, moves);
  }

  /**
   * Gets all possible king moves
   * @param {number} row - Row of the king
   * @param {number} col - Column of the king
   * @param {string} color - Color of the king
   * @param {Array} moves - Array to store valid moves
   * @param {boolean} attackOnly - If true, only consider attack paths
   */
  getKingMoves(row, col, color, moves, attackOnly = false) {
    const directions = [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 },                        { row: 0, col: 1 },
      { row: 1, col: -1 },  { row: 1, col: 0 },   { row: 1, col: 1 }
    ];

    // Regular king moves
    for (const dir of directions) {
      const targetRow = row + dir.row;
      const targetCol = col + dir.col;
      if (this.isSquareValidAndNotOccupiedByAlly(targetRow, targetCol, color)) {
        moves.push({
          from: { row, col },
          to: { row: targetRow, col: targetCol }
        });
      }
    }

    // Castling (not relevant for attackOnly)
    if (
      !attackOnly &&
      !this.isKingInCheck(color)
    ) {
      const king = this.board[row][col];
      if (!king.moved) {
        // Kingside castling
        if (
          this.castlingRights[color].kingSide &&
          this.isSquareEmpty(row, col + 1) &&
          this.isSquareEmpty(row, col + 2)
        ) {
          const rookCol = 7;
          const rook = this.board[row][rookCol];
          if (
            rook &&
            rook.type === 'rook' &&
            !rook.moved &&
            !this.isSquareAttacked(row, col + 1, color === 'white' ? 'black' : 'white') &&
            !this.isSquareAttacked(row, col + 2, color === 'white' ? 'black' : 'white')
          ) {
            moves.push({
              from: { row, col },
              to: { row, col: col + 2 },
              specialMove: {
                type: 'castling',
                rookFrom: { row, col: rookCol },
                rookTo: { row, col: col + 1 }
              }
            });
          }
        }

        // Queenside castling
        if (
          this.castlingRights[color].queenSide &&
          this.isSquareEmpty(row, col - 1) &&
          this.isSquareEmpty(row, col - 2) &&
          this.isSquareEmpty(row, col - 3)
        ) {
          const rookCol = 0;
          const rook = this.board[row][rookCol];
          if (
            rook &&
            rook.type === 'rook' &&
            !rook.moved &&
            !this.isSquareAttacked(row, col - 1, color === 'white' ? 'black' : 'white') &&
            !this.isSquareAttacked(row, col - 2, color === 'white' ? 'black' : 'white')
          ) {
            moves.push({
              from: { row, col },
              to: { row, col: col - 2 },
              specialMove: {
                type: 'castling',
                rookFrom: { row, col: rookCol },
                rookTo: { row, col: col - 1 }
              }
            });
          }
        }
      }
    }
  }

  /**
   * Gets sliding moves (for bishop, rook, queen)
   * @param {number} row - Row of the piece
   * @param {number} col - Column of the piece
   * @param {string} color - Color of the piece
   * @param {Array} moves - Array to store valid moves
   * @param {Array} directions - Array of direction vectors
   */
  getSlidingMoves(row, col, color, moves, directions) {
    for (const dir of directions) {
      let currRow = row + dir.row;
      let currCol = col + dir.col;

      while (this.isSquareValid(currRow, currCol)) {
        const targetPiece = this.board[currRow][currCol];

        if (!targetPiece) {
          moves.push({
            from: { row, col },
            to: { row: currRow, col: currCol }
          });
        } else if (targetPiece.color !== color) {
          moves.push({
            from: { row, col },
            to: { row: currRow, col: currCol }
          });
          break;
        } else {
          break;
        }

        currRow += dir.row;
        currCol += dir.col;
      }
    }
  }

  /**
   * Checks if a square is valid (within the board)
   * @param {number} row - Row of the square
   * @param {number} col - Column of the square
   * @returns {boolean} - Whether the square is valid
   */
  isSquareValid(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  /**
   * Checks if a square is empty
   * @param {number} row - Row of the square
   * @param {number} col - Column of the square
   * @returns {boolean} - Whether the square is empty
   */
  isSquareEmpty(row, col) {
    if (!this.isSquareValid(row, col)) return false;
    return this.board[row][col] === null;
  }

  /**
   * Checks if a square is valid and not occupied by ally
   * @param {number} row - Row of the square
   * @param {number} col - Column of the square
   * @param {string} allyColor - Color of ally pieces
   * @returns {boolean} - Whether the square is valid and not occupied by ally
   */
  isSquareValidAndNotOccupiedByAlly(row, col, allyColor) {
    if (!this.isSquareValid(row, col)) return false;
    const piece = this.board[row][col];
    return !piece || piece.color !== allyColor;
  }

  /**
   * Checks if any piece of a given color has valid moves
   * @param {string} color - Color to check
   * @returns {boolean} - Whether the player has any valid moves
   */
  hasAnyValidMoves(color) {
    if (this.gameStatus === 'checkmate' || this.gameStatus === 'stalemate' || this.gameStatus === 'draw') return false;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === color) {
          // When testing opponent's valid moves, set currentPlayer to match color for full move list, but only temporarily!
          const oldPlayer = this.currentPlayer;
          this.currentPlayer = color;
          const moves = this.getValidMoves(row, col);
          this.currentPlayer = oldPlayer;
          if (moves.length > 0) return true;
        }
      }
    }
    return false;
  }

  /**
   * Checks if there's insufficient material for checkmate
   * @returns {boolean} - Whether there's insufficient material
   */
  isInsufficientMaterial() {
    const pieces = this.getAllPieces();

    // King vs King
    if (pieces.length === 2) return true;

    // King + Knight/Bishop vs King
    if (pieces.length === 3) {
      const nonKings = pieces.filter(p => p.type !== 'king');
      if (nonKings.length === 1 && (nonKings[0].type === 'knight' || nonKings[0].type === 'bishop')) {
        return true;
      }
    }

    // King + Bishop vs King + Bishop (same color bishops)
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'bishop');
      if (bishops.length === 2) {
        // Check if bishops are on same color squares
        const bishop1Pos = this.findPiece(bishops[0]);
        const bishop2Pos = this.findPiece(bishops[1]);
        if (
          bishop1Pos &&
          bishop2Pos &&
          (bishop1Pos.row + bishop1Pos.col) % 2 ===
            (bishop2Pos.row + bishop2Pos.col) % 2
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Gets all pieces currently on the board
   * @returns {Array} - Array of all pieces
   */
  getAllPieces() {
    const pieces = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col]) {
          pieces.push(this.board[row][col]);
        }
      }
    }
    return pieces;
  }

  /**
   * Finds the position of a specific piece
   * @param {Object} targetPiece - The piece to find
   * @returns {Object|null} - Position {row, col} or null if not found
   */
  findPiece(targetPiece) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === targetPiece) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Checks for threefold repetition
   * @returns {boolean} - Whether threefold repetition has occurred
   */
  isThreefoldRepetition() {
    // Collect all board keys
    const positions = {};
    let count = 1;
    const currKey = this._getThreefoldKey();
    positions[currKey] = 1;

    for (let i = this.moveHistory.length - 1; i >= 0; i--) {
      // Undo simulated on fresh model, not actually undone
      // Use a synthetic history scan, which checks the position hash every fullmove step
      const move = this.moveHistory[i];
      if (!move) continue;
      // For a true threefold repetition, must compare current position, including side, castling, ep
      // Generate a synthetic model and play all moves up to i, storing keys
      const model = new ChessModel();
      model.importFEN(this._fenFromMoveHistoryIndex(i));
      const key = model._getThreefoldKey();
      positions[key] = (positions[key] || 0) + 1;
      count = Math.max(count, positions[key]);
      if (positions[key] >= 3) return true;
    }
    return false;
  }

  // Helper: Get unique key for threefold repetition (includes board, currentPlayer, castling rights, ep)
  _getThreefoldKey() {
    // Piece layout, player, castling, ep
    let key = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = this.board[row][col];
        key += p ? (p.color[0] + p.type[0]) : '..';
      }
    }
    key += this.currentPlayer[0];
    key += (this.castlingRights.white.kingSide ? 'K' : '.') +
      (this.castlingRights.white.queenSide ? 'Q' : '.') +
      (this.castlingRights.black.kingSide ? 'k' : '.') +
      (this.castlingRights.black.queenSide ? 'q' : '.');
    key += this.enPassantTarget
      ? String.fromCharCode(97 + this.enPassantTarget.col) + (8 - this.enPassantTarget.row)
      : '--';
    return key;
  }

  // Helper: get FEN from the given moveHistory index for threefold repetition check
  _fenFromMoveHistoryIndex(idx) {
    // Generate the FEN that the model had *just before* the move at idx
    // Undo one move at a time
    const tempModel = new ChessModel();
    for (let i = 0; i < idx; i++) {
      const m = this.moveHistory[i];
      tempModel.makeMove(m.from, m.to, m.promotion);
    }
    return tempModel.exportFEN();
  }

  /**
   * Gets a string representation of the current board position
   * @returns {string} - String representation of the board
   */
  getBoardPositionString() {
    let positionString = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          positionString += piece.color[0] + piece.type[0];
        } else {
          positionString += '--';
        }
      }
    }
    positionString += this.currentPlayer[0];
    positionString += (this.castlingRights.white.kingSide ? 'K' : '-');
    positionString += (this.castlingRights.white.queenSide ? 'Q' : '-');
    positionString += (this.castlingRights.black.kingSide ? 'k' : '-');
    positionString += (this.castlingRights.black.queenSide ? 'q' : '-');
    if (this.enPassantTarget) {
      positionString += `${this.enPassantTarget.row}${this.enPassantTarget.col}`;
    } else {
      positionString += '--';
    }
    return positionString;
  }

  /**
   * Undoes the last move
   * @returns {boolean} - Whether a move was successfully undone
   */
  undoMove() {
    if (this.moveHistory.length === 0) return false;

    const lastMove = this.moveHistory.pop();

    // Restore piece to its original position
    let movedPiece = this.board[lastMove.to.row][lastMove.to.col];
    if (
      lastMove.promotion &&
      lastMove.specialMove &&
      lastMove.specialMove.type === 'pawnPromotion'
    ) {
      // Revert to pawn
      movedPiece = { type: 'pawn', color: lastMove.color, moved: true };
    }

    this.board[lastMove.from.row][lastMove.from.col] = movedPiece;

    // Remove from destination
    this.board[lastMove.to.row][lastMove.to.col] = null;

    // Restore captured piece if present
    if (lastMove.captured) {
      let revivedType = lastMove.captured;
      let revivedColor = lastMove.capturedColor || (lastMove.color === 'white' ? 'black' : 'white');
      if (
        lastMove.specialMove &&
        lastMove.specialMove.type === 'enPassant'
      ) {
        // Place the captured pawn back
        const { row, col } = lastMove.specialMove.capturedPawn;
        this.board[row][col] = { type: 'pawn', color: revivedColor, moved: true };
      } else {
        this.board[lastMove.to.row][lastMove.to.col] = {
          type: revivedType,
          color: revivedColor,
        };
      }
    }

    // Handle special moves
    if (lastMove.specialMove) {
      switch (lastMove.specialMove.type) {
        case 'castling': {
          // Restore rook
          const { rookFrom, rookTo } = lastMove.specialMove;
          this.board[rookFrom.row][rookFrom.col] = this.board[rookTo.row][rookTo.col];
          this.board[rookTo.row][rookTo.col] = null;
          if (this.board[rookFrom.row][rookFrom.col])
            this.board[rookFrom.row][rookFrom.col].moved = false;
          break;
        }
      }
    }

    // Restore moved flag of moved piece
    if (this.board[lastMove.from.row][lastMove.from.col] && typeof this.board[lastMove.from.row][lastMove.from.col].moved !== 'undefined') {
      // If it was king/rook, and lastMove.from is starting square, reset moved to false
      if (
        lastMove.from.row === 7 && lastMove.from.col === 4 && this.board[lastMove.from.row][lastMove.from.col].type === 'king' && this.board[lastMove.from.row][lastMove.from.col].color === 'white'
      ) {
        this.board[lastMove.from.row][lastMove.from.col].moved = false;
      }
      if (
        lastMove.from.row === 0 && lastMove.from.col === 4 && this.board[lastMove.from.row][lastMove.from.col].type === 'king' && this.board[lastMove.from.row][lastMove.from.col].color === 'black'
      ) {
        this.board[lastMove.from.row][lastMove.from.col].moved = false;
      }
      // White queen/king rook
      if (
        lastMove.from.row === 7 &&
        lastMove.from.col === 0 &&
        this.board[lastMove.from.row][lastMove.from.col].type === 'rook' &&
        this.board[lastMove.from.row][lastMove.from.col].color === 'white'
      ) {
        this.board[lastMove.from.row][lastMove.from.col].moved = false;
      }
      if (
        lastMove.from.row === 7 &&
        lastMove.from.col === 7 &&
        this.board[lastMove.from.row][lastMove.from.col].type === 'rook' &&
        this.board[lastMove.from.row][lastMove.from.col].color === 'white'
      ) {
        this.board[lastMove.from.row][lastMove.from.col].moved = false;
      }
      // Black queen/king rook
      if (
        lastMove.from.row === 0 &&
        lastMove.from.col === 0 &&
        this.board[lastMove.from.row][lastMove.from.col].type === 'rook' &&
        this.board[lastMove.from.row][lastMove.from.col].color === 'black'
      ) {
        this.board[lastMove.from.row][lastMove.from.col].moved = false;
      }
      if (
        lastMove.from.row === 0 &&
        lastMove.from.col === 7 &&
        this.board[lastMove.from.row][lastMove.from.col].type === 'rook' &&
        this.board[lastMove.from.row][lastMove.from.col].color === 'black'
      ) {
        this.board[lastMove.from.row][lastMove.from.col].moved = false;
      }
      // In other cases, keep moved as true
    }

    // Restore en passant target
    this.enPassantTarget = lastMove.enPassantTarget
      ? { ...lastMove.enPassantTarget }
      : null;

    // Restore castling rights
    this.castlingRights = JSON.parse(JSON.stringify(lastMove.castlingRights));

    // Restore half-move clock and full move number
    this.halfMoveClock = lastMove.halfMoveClock;
    this.fullMoveNumber = lastMove.fullMoveNumber;

    // Switch player back
    this.currentPlayer = lastMove.color;

    // Update game status
    this.updateGameStatus();

    return true;
  }

  /**
   * Creates a deep copy of the current board
   * @returns {Array} - Cloned board
   */
  cloneBoard() {
    return JSON.parse(JSON.stringify(this.board));
  }

  /**
   * Gets the current game state as an object
   * @returns {Object} - Current game state
   */
  getGameState() {
    return {
      board: this.cloneBoard(),
      currentPlayer: this.currentPlayer,
      gameStatus: this.gameStatus,
      moveHistory: JSON.parse(JSON.stringify(this.moveHistory)),
      enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null,
      castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber
    };
  }

  /**
   * Loads a game state
   * @param {Object} state - Game state to load
   */
  loadGameState(state) {
    this.board = state.board;
    this.currentPlayer = state.currentPlayer;
    this.gameStatus = state.gameStatus;
    this.moveHistory = state.moveHistory;
    this.enPassantTarget = state.enPassantTarget;
    this.castlingRights = state.castlingRights;
    this.halfMoveClock = state.halfMoveClock;
    this.fullMoveNumber = state.fullMoveNumber;
    this.updateGameStatus();
  }

  /**
   * Exports the current game in Forsyth-Edwards Notation (FEN)
   * @returns {string} - FEN string
   */
  exportFEN() {
    let fen = '';
    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          const pieceCode = piece.type === 'knight' ? 'n' : piece.type[0];
          fen += piece.color === 'white' ? pieceCode.toUpperCase() : pieceCode;
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (row < 7) fen += '/';
    }

    // Active color
    fen += ` ${this.currentPlayer[0]}`;

    // Castling availability
    let castling = '';
    if (this.castlingRights.white.kingSide) castling += 'K';
    if (this.castlingRights.white.queenSide) castling += 'Q';
    if (this.castlingRights.black.kingSide) castling += 'k';
    if (this.castlingRights.black.queenSide) castling += 'q';
    fen += ` ${castling || '-'}`;

    // En passant target square
    if (this.enPassantTarget) {
      const file = String.fromCharCode(97 + this.enPassantTarget.col);
      const rank = 8 - this.enPassantTarget.row;
      fen += ` ${file}${rank}`;
    } else {
      fen += ' -';
    }

    // Halfmove clock and fullmove number
    fen += ` ${this.halfMoveClock} ${this.fullMoveNumber}`;

    return fen;
  }

  /**
   * Imports a game from Forsyth-Edwards Notation (FEN)
   * @param {string} fen - FEN string
   * @returns {boolean} - Whether the import was successful
   */
  importFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length !== 6) return false;

    const [boardPart, activePart, castlingPart, enPassantPart, halfMovePart, fullMovePart] = parts;

    // Reset the board
    this.board = this.createEmptyBoard();

    // Parse board position
    const rows = boardPart.split('/');
    if (rows.length !== 8) return false;

    for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
      let colIndex = 0;
      for (let charIndex = 0; charIndex < rows[rowIndex].length; charIndex++) {
        const char = rows[rowIndex][charIndex];
        if (/[1-8]/.test(char)) {
          colIndex += parseInt(char, 10);
        } else {
          const color = char === char.toUpperCase() ? 'white' : 'black';
          let type;
          switch (char.toLowerCase()) {
            case 'p': type = 'pawn'; break;
            case 'n': type = 'knight'; break;
            case 'b': type = 'bishop'; break;
            case 'r': type = 'rook'; break;
            case 'q': type = 'queen'; break;
            case 'k': type = 'king'; break;
            default: return false;
          }
          this.board[rowIndex][colIndex] = {
            type,
            color,
            moved:
              type === 'king' ||
              type === 'rook' ||
              type === 'pawn'
                ? false
                : undefined
          };
          colIndex++;
        }
      }
      if (colIndex !== 8) return false;
    }

    // Parse active color
    this.currentPlayer = activePart === 'w' ? 'white' : 'black';

    // Parse castling rights
    this.castlingRights = {
      white: { kingSide: false, queenSide: false },
      black: { kingSide: false, queenSide: false }
    };

    if (castlingPart !== '-') {
      for (const char of castlingPart) {
        switch (char) {
          case 'K': this.castlingRights.white.kingSide = true; break;
          case 'Q': this.castlingRights.white.queenSide = true; break;
          case 'k': this.castlingRights.black.kingSide = true; break;
          case 'q': this.castlingRights.black.queenSide = true; break;
        }
      }
    }

    // Parse en passant target
    if (enPassantPart === '-') {
      this.enPassantTarget = null;
    } else {
      const col = enPassantPart.charCodeAt(0) - 97;
      const row = 8 - parseInt(enPassantPart[1], 10);
      this.enPassantTarget = { row, col };
    }

    // Parse halfmove clock and fullmove number
    this.halfMoveClock = parseInt(halfMovePart, 10);
    this.fullMoveNumber = parseInt(fullMovePart, 10);

    // Clear move history and update game status
    this.moveHistory = [];
    this.updateGameStatus();

    return true;
  }
}
