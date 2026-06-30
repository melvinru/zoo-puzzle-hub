// --- Kids Sudoku Game Engine ---
const SUDOKU_TILES = {
  1: { emoji: '🐶', name: '1', color: '#E0FFF3' },
  2: { emoji: '🐱', name: '2', color: '#FFE4E1' },
  3: { emoji: '🐰', name: '3', color: '#FFDAB9' },
  4: { emoji: '🦊', name: '4', color: '#E6FAFF' },
  5: { emoji: '🐻', name: '5', color: '#F4E6FF' },
  6: { emoji: '🐼', name: '6', color: '#FFF0F5' },
  7: { emoji: '🐨', name: '7', color: '#FFF9E6' },
  8: { emoji: '🦁', name: '8', color: '#FFEBEB' },
  9: { emoji: '🐯', name: '9', color: '#E6FFF9' }
};

class AppSudokuClass {
  constructor() {
    this.boardSize = 4; // default: 4x4 (Easy)
    this.grid = []; // 2D array of values (1-Size) or null
    this.solved = []; // 2D solved solution grid
    this.staticCells = []; // 2D array of booleans (true if starting clue)
    this.errors = []; // 2D array of booleans (true if conflict)
    this.selectedCell = null; // { row, col } of currently highlighted cell
    this.errorCount = 0;
    this.progressCount = 0;
    this.won = false;
    this.wins = { 4: 0, 6: 0, 9: 0 };
  }

  init() {
    this.bindEvents();
    this.loadWins();
    this.updateWinsUI();

    // Load or generate board
    if (!this.loadState()) {
      this.startNewGame();
    } else {
      this.validateBoard();
      this.renderBoard();
      this.renderKeypad();
      this.selectFirstEmptyCell();
    }
  }

  setBoardSize(size) {
    if (this.boardSize === size) return;
    this.boardSize = size;
    
    // Save to settings immediately
    try {
      localStorage.setItem('zoo_sudoku_board_size', this.boardSize);
    } catch(e) {}

    if (!this.loadState()) {
      this.startNewGame();
    } else {
      this.validateBoard();
      this.renderBoard();
      this.renderKeypad();
      this.selectFirstEmptyCell();
    }
  }

  startNewGame() {
    this.won = false;
    const baseGrid = this.generateGrid();
    
    // Create puzzle: clear random cells based on size
    const totalCells = this.boardSize * this.boardSize;
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = totalCells - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    let blankCount = 6; // 4x4 (Easy)
    if (this.boardSize === 6) blankCount = 15; // 6x6 (Medium)
    if (this.boardSize === 9) blankCount = 35; // 9x9 (Hard)

    this.grid = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    this.staticCells = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(true));
    this.solved = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        this.solved[r][c] = baseGrid[r][c];
        this.grid[r][c] = baseGrid[r][c];
      }
    }

    for (let i = 0; i < blankCount; i++) {
      const idx = indices[i];
      const r = Math.floor(idx / this.boardSize);
      const c = idx % this.boardSize;
      this.grid[r][c] = null;
      this.staticCells[r][c] = false;
    }

    this.selectedCell = null;
    this.validateBoard();
    this.renderBoard();
    this.renderKeypad();
    this.selectFirstEmptyCell();
    this.saveState();
  }

  generateGrid() {
    if (this.boardSize === 4) {
      return this.generateGrid4x4();
    } else if (this.boardSize === 6) {
      return this.generateGrid6x6();
    } else {
      return this.generateGrid9x9();
    }
  }

  generateGrid4x4() {
    const base = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1]
    ];

    // Shuffling
    if (Math.random() > 0.5) [base[0], base[1]] = [base[1], base[0]];
    if (Math.random() > 0.5) [base[2], base[3]] = [base[3], base[2]];

    if (Math.random() > 0.5) {
      for (let r = 0; r < 4; r++) {
        [base[r][0], base[r][1]] = [base[r][1], base[r][0]];
      }
    }
    if (Math.random() > 0.5) {
      for (let r = 0; r < 4; r++) {
        [base[r][2], base[r][3]] = [base[r][3], base[r][2]];
      }
    }

    if (Math.random() > 0.5) {
      [base[0], base[2]] = [base[2], base[0]];
      [base[1], base[3]] = [base[3], base[1]];
    }

    if (Math.random() > 0.5) {
      for (let r = 0; r < 4; r++) {
        [base[r][0], base[r][2]] = [base[r][2], base[r][0]];
        [base[r][1], base[r][3]] = [base[r][3], base[r][1]];
      }
    }

    const digits = [1, 2, 3, 4];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        base[r][c] = digits[base[r][c] - 1];
      }
    }

    if (Math.random() > 0.5) {
      const transposed = Array(4).fill(null).map(() => Array(4).fill(0));
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          transposed[c][r] = base[r][c];
        }
      }
      return transposed;
    }

    return base;
  }

  generateGrid6x6() {
    const base = [
      [1, 2, 3, 4, 5, 6],
      [4, 5, 6, 1, 2, 3],
      [2, 3, 1, 5, 6, 4],
      [5, 6, 4, 2, 3, 1],
      [3, 1, 2, 6, 4, 5],
      [6, 4, 5, 3, 1, 2]
    ];

    // Shuffling
    // 1. Swap rows within blocks (rows 0-1, 2-3, 4-5)
    if (Math.random() > 0.5) [base[0], base[1]] = [base[1], base[0]];
    if (Math.random() > 0.5) [base[2], base[3]] = [base[3], base[2]];
    if (Math.random() > 0.5) [base[4], base[5]] = [base[5], base[4]];

    // 2. Swap columns within blocks (cols 0-2, 3-5)
    const shuffleCols6 = (grid, start) => {
      const indices = [start, start + 1, start + 2];
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let r = 0; r < 6; r++) {
        const rCopy = [...grid[r]];
        grid[r][start] = rCopy[indices[0]];
        grid[r][start + 1] = rCopy[indices[1]];
        grid[r][start + 2] = rCopy[indices[2]];
      }
    };
    shuffleCols6(base, 0);
    shuffleCols6(base, 3);

    // 3. Swap row blocks (block 0 (r0-1), block 1 (r2-3), block 2 (r4-5))
    const rowBlocks = [
      [base[0], base[1]],
      [base[2], base[3]],
      [base[4], base[5]]
    ];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rowBlocks[i], rowBlocks[j]] = [rowBlocks[j], rowBlocks[i]];
    }
    for (let b = 0; b < 3; b++) {
      base[b * 2] = rowBlocks[b][0];
      base[b * 2 + 1] = rowBlocks[b][1];
    }

    // 4. Swap col blocks (cols 0-2 with 3-5)
    if (Math.random() > 0.5) {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 3; c++) {
          [base[r][c], base[r][c + 3]] = [base[r][c + 3], base[r][c]];
        }
      }
    }

    // 5. Shuffle symbol digits
    const digits = [1, 2, 3, 4, 5, 6];
    for (let i = 5; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        base[r][c] = digits[base[r][c] - 1];
      }
    }

    // 6. Transpose (Removed because transposing a 6x6 grid changes block shape from 2x3 to 3x2, violating the 2x3 layout rules)
    return base;
  }

  generateGrid9x9() {
    const base = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 1, 5, 6, 4, 8, 9, 7],
      [5, 6, 4, 8, 9, 7, 2, 3, 1],
      [8, 9, 7, 2, 3, 1, 5, 6, 4],
      [3, 1, 2, 6, 4, 5, 9, 7, 8],
      [6, 4, 5, 9, 7, 8, 3, 1, 2],
      [9, 7, 8, 3, 1, 2, 6, 4, 5]
    ];

    // Shuffling
    // 1. Shuffle rows within blocks (r0-2, r3-5, r6-8)
    const shuffleRowsInBlock = (grid, start) => {
      const indices = [start, start + 1, start + 2];
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const r0 = grid[indices[0]];
      const r1 = grid[indices[1]];
      const r2 = grid[indices[2]];
      grid[start] = r0;
      grid[start + 1] = r1;
      grid[start + 2] = r2;
    };
    shuffleRowsInBlock(base, 0);
    shuffleRowsInBlock(base, 3);
    shuffleRowsInBlock(base, 6);

    // 2. Shuffle columns within blocks (c0-2, c3-5, c6-8)
    const shuffleColsInBlock = (grid, start) => {
      const indices = [start, start + 1, start + 2];
      for (let i = 2; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let r = 0; r < 9; r++) {
        const rCopy = [...grid[r]];
        grid[r][start] = rCopy[indices[0]];
        grid[r][start + 1] = rCopy[indices[1]];
        grid[r][start + 2] = rCopy[indices[2]];
      }
    };
    shuffleColsInBlock(base, 0);
    shuffleColsInBlock(base, 3);
    shuffleColsInBlock(base, 6);

    // 3. Shuffle row blocks (block 0 (r0-2), block 1 (r3-5), block 2 (r6-8))
    const rowBlocks = [
      [base[0], base[1], base[2]],
      [base[3], base[4], base[5]],
      [base[6], base[7], base[8]]
    ];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rowBlocks[i], rowBlocks[j]] = [rowBlocks[j], rowBlocks[i]];
    }
    for (let b = 0; b < 3; b++) {
      for (let r = 0; r < 3; r++) {
        base[b * 3 + r] = rowBlocks[b][r];
      }
    }

    // 4. Shuffle column blocks (cols 0-2, 3-5, 6-8)
    const colBlocks = [0, 1, 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colBlocks[i], colBlocks[j]] = [colBlocks[j], colBlocks[i]];
    }
    const baseCopy = base.map(row => [...row]);
    for (let r = 0; r < 9; r++) {
      for (let b = 0; b < 3; b++) {
        for (let c = 0; c < 3; c++) {
          base[r][b * 3 + c] = baseCopy[r][colBlocks[b] * 3 + c];
        }
      }
    }

    // 5. Shuffle symbol digits
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 8; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        base[r][c] = digits[base[r][c] - 1];
      }
    }

    // 6. Transpose
    if (Math.random() > 0.5) {
      const transposed = Array(9).fill(null).map(() => Array(9).fill(0));
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          transposed[c][r] = base[r][c];
        }
      }
      return transposed;
    }

    return base;
  }

  saveState() {
    try {
      localStorage.setItem('zoo_sudoku_board_size', this.boardSize);
      localStorage.setItem(`zoo_sudoku_grid_${this.boardSize}`, JSON.stringify(this.grid));
      localStorage.setItem(`zoo_sudoku_solved_${this.boardSize}`, JSON.stringify(this.solved));
      localStorage.setItem(`zoo_sudoku_static_${this.boardSize}`, JSON.stringify(this.staticCells));
    } catch (e) {
      console.warn("Could not save Sudoku state:", e);
    }
  }

  loadState() {
    try {
      const savedSize = localStorage.getItem('zoo_sudoku_board_size');
      if (savedSize) {
        this.boardSize = parseInt(savedSize);
      }
      const savedGrid = localStorage.getItem(`zoo_sudoku_grid_${this.boardSize}`);
      const savedSolved = localStorage.getItem(`zoo_sudoku_solved_${this.boardSize}`);
      const savedStatic = localStorage.getItem(`zoo_sudoku_static_${this.boardSize}`);
      if (savedGrid && savedSolved && savedStatic) {
        const parsedGrid = JSON.parse(savedGrid);
        const parsedSolved = JSON.parse(savedSolved);
        const parsedStatic = JSON.parse(savedStatic);
        if (parsedGrid && parsedGrid.length === this.boardSize &&
            parsedSolved && parsedSolved.length === this.boardSize &&
            parsedStatic && parsedStatic.length === this.boardSize) {
          this.grid = parsedGrid;
          this.solved = parsedSolved;
          this.staticCells = parsedStatic;
          return true;
        }
      }

      // Fallback to legacy single keys if size matches
      const legacySize = localStorage.getItem('zoo_sudoku_board_size');
      if (legacySize && parseInt(legacySize) === this.boardSize) {
        const legacyGrid = localStorage.getItem('zoo_sudoku_grid');
        const legacySolved = localStorage.getItem('zoo_sudoku_solved');
        const legacyStatic = localStorage.getItem('zoo_sudoku_static');
        if (legacyGrid && legacySolved && legacyStatic) {
          const parsedGrid = JSON.parse(legacyGrid);
          const parsedSolved = JSON.parse(legacySolved);
          const parsedStatic = JSON.parse(legacyStatic);
          if (parsedGrid && parsedGrid.length === this.boardSize &&
              parsedSolved && parsedSolved.length === this.boardSize &&
              parsedStatic && parsedStatic.length === this.boardSize) {
            this.grid = parsedGrid;
            this.solved = parsedSolved;
            this.staticCells = parsedStatic;
            return true;
          }
        }
      }
    } catch (e) {
      console.warn("Could not load Sudoku state:", e);
    }
    return false;
  }

  validateBoard() {
    if (!this.grid || this.grid.length === 0) return;
    this.errors = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
    let errorCount = 0;
    let filledCount = 0;

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const val = this.grid[r][c];
        if (val !== null) {
          filledCount++;
          let hasConflict = false;

          // Check row
          for (let tc = 0; tc < this.boardSize; tc++) {
            if (tc !== c && this.grid[r][tc] === val) {
              hasConflict = true;
              this.errors[r][tc] = true;
            }
          }

          // Check col
          for (let tr = 0; tr < this.boardSize; tr++) {
            if (tr !== r && this.grid[tr][c] === val) {
              hasConflict = true;
              this.errors[tr][c] = true;
            }
          }

          // Check block
          let brSize = 2; // block row size
          let bcSize = 2; // block col size
          if (this.boardSize === 6) { brSize = 2; bcSize = 3; }
          if (this.boardSize === 9) { brSize = 3; bcSize = 3; }

          const br = Math.floor(r / brSize) * brSize;
          const bc = Math.floor(c / bcSize) * bcSize;
          for (let tr = br; tr < br + brSize; tr++) {
            for (let tc = bc; tc < bc + bcSize; tc++) {
              if ((tr !== r || tc !== c) && this.grid[tr][tc] === val) {
                hasConflict = true;
                this.errors[tr][tc] = true;
              }
            }
          }

          if (hasConflict) {
            this.errors[r][c] = true;
          }
        }
      }
    }

    // Count error cells
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (this.errors[r][c]) {
          errorCount++;
        }
      }
    }

    this.errorCount = errorCount;
    this.progressCount = filledCount;

    // Update UI Stats
    document.getElementById('sudoku-stat-errors').textContent = errorCount;
    const totalCells = this.boardSize * this.boardSize;
    document.getElementById('sudoku-stat-progress').textContent = `${filledCount} / ${totalCells}`;

    // Update Status Banner
    const banner = document.getElementById('sudoku-status-banner');
    if (errorCount > 0) {
      banner.className = 'fifteen-banner unsolvable';
      banner.textContent = 'Есть ошибки! Проверьте строки, столбцы и блоки. ❌';
    } else if (filledCount === totalCells) {
      banner.className = 'fifteen-banner solvable';
      banner.textContent = 'Отличная работа! Все правильно! 🎉';
    } else {
      banner.className = 'fifteen-banner solvable';
      banner.textContent = 'Заполните пустые клетки! ⚡';
    }
  }

  renderBoard() {
    if (!this.grid || this.grid.length === 0) return;
    const board = document.getElementById('sudoku-board');
    board.innerHTML = '';

    // Dynamically set CSS variables & layout class on board container
    board.className = `board grid-${this.boardSize}x${this.boardSize}`;
    board.style.setProperty('--grid-size', this.boardSize);

    const mode = window.portal ? window.portal.gameMode : 'animals';

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const val = this.grid[r][c];
        const cell = document.createElement('div');
        cell.className = 'grid-cell sudoku-cell';
        
        // Alternating subgrid blocks background coloring
        let isAlt = false;
        if (this.boardSize === 4) {
          isAlt = (Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 1;
        } else if (this.boardSize === 6) {
          isAlt = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 1;
        } else if (this.boardSize === 9) {
          isAlt = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1;
        }
        if (isAlt) {
          cell.classList.add('block-alt');
        }

        // Static clues vs editable
        if (this.staticCells[r][c]) {
          cell.classList.add('sudoku-static');
        } else if (val !== null) {
          cell.classList.add('sudoku-user-filled');
        }

        // Selected cell highlight
        if (this.selectedCell && this.selectedCell.row === r && this.selectedCell.col === c) {
          cell.classList.add('selected');
        }

        // Conflict error highlight
        if (this.errors[r][c]) {
          cell.classList.add('sudoku-error');
        }

        // Subgrid block fully filled highlight
        let brSize = 2;
        let bcSize = 2;
        if (this.boardSize === 6) { brSize = 2; bcSize = 3; }
        if (this.boardSize === 9) { brSize = 3; bcSize = 3; }

        const br = Math.floor(r / brSize) * brSize;
        const bc = Math.floor(c / bcSize) * bcSize;
        let blockFilled = true;
        for (let tr = br; tr < br + brSize; tr++) {
          for (let tc = bc; tc < bc + bcSize; tc++) {
            if (this.grid[tr][tc] === null) {
              blockFilled = false;
              break;
            }
          }
          if (!blockFilled) break;
        }

        if (blockFilled) {
          cell.classList.add('sudoku-block-filled');
        }

        // Render value contents
        if (val !== null) {
          const inner = document.createElement('div');
          inner.className = 'tile-inner';
          
          if (mode === 'animals') {
            const data = SUDOKU_TILES[val];
            const icon = document.createElement('span');
            icon.className = 'tile-icon';
            icon.textContent = data.emoji;
            
            const label = document.createElement('span');
            label.className = 'tile-label';
            label.textContent = data.name;
            
            inner.appendChild(icon);
            inner.appendChild(label);
          } else {
            const num = document.createElement('span');
            num.className = 'tile-number';
            num.textContent = val;
            inner.appendChild(num);
          }
          cell.appendChild(inner);
        }

        // Selection listener
        cell.addEventListener('click', () => {
          if (window.GameAudio) window.GameAudio.playSwipe();
          this.selectCell(r, c);
        });

        board.appendChild(cell);
      }
    }

    // Append cross divider overlay lines dynamically
    let vDividers = [];
    if (this.boardSize === 4 || this.boardSize === 6) {
      vDividers = [50];
    } else if (this.boardSize === 9) {
      vDividers = [33.333, 66.666];
    }
    vDividers.forEach(pct => {
      const line = document.createElement('div');
      line.className = 'sudoku-divider vertical';
      line.style.left = `${pct}%`;
      board.appendChild(line);
    });

    let hDividers = [];
    if (this.boardSize === 4) {
      hDividers = [50];
    } else if (this.boardSize === 6 || this.boardSize === 9) {
      hDividers = [33.333, 66.666];
    }
    hDividers.forEach(pct => {
      const line = document.createElement('div');
      line.className = 'sudoku-divider horizontal';
      line.style.top = `${pct}%`;
      board.appendChild(line);
    });
  }

  renderKeypad() {
    const keypad = document.getElementById('sudoku-keypad');
    keypad.innerHTML = '';
    const mode = window.portal ? window.portal.gameMode : 'animals';

    // Keypad numbers 1 to Size
    for (let val = 1; val <= this.boardSize; val++) {
      const btn = document.createElement('button');
      btn.className = 'btn-keypad';
      
      if (mode === 'animals') {
        const data = SUDOKU_TILES[val];
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'keypad-emoji';
        emojiSpan.textContent = data.emoji;
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'keypad-label';
        labelSpan.textContent = data.name;
        
        btn.appendChild(emojiSpan);
        btn.appendChild(labelSpan);
      } else {
        btn.textContent = val;
      }

      btn.addEventListener('click', () => {
        if (window.GameAudio) window.GameAudio.playClick();
        this.setCellValue(val);
      });

      keypad.appendChild(btn);
    }

    // Erase key
    const eraseBtn = document.createElement('button');
    eraseBtn.className = 'btn-keypad erase';
    eraseBtn.title = 'Стереть значение';
    
    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'keypad-emoji';
    emojiSpan.textContent = '❌';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'keypad-label';
    labelSpan.textContent = 'Стереть';
    
    eraseBtn.appendChild(emojiSpan);
    eraseBtn.appendChild(labelSpan);

    eraseBtn.addEventListener('click', () => {
      if (window.GameAudio) window.GameAudio.playClick();
      this.setCellValue(null);
    });

    keypad.appendChild(eraseBtn);
  }

  selectCell(row, col) {
    if (this.staticCells[row][col]) return; // Static clues are locked
    this.selectedCell = { row, col };
    this.renderBoard();
  }

  selectFirstEmptyCell() {
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.staticCells[r][c] && this.grid[r][c] === null) {
          this.selectedCell = { row: r, col: c };
          return;
        }
      }
    }
    // Fallback to first non-clue cell
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.staticCells[r][c]) {
          this.selectedCell = { row: r, col: c };
          return;
        }
      }
    }
  }

  setCellValue(value) {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    if (this.staticCells[row][col]) return;

    this.grid[row][col] = value;
    this.validateBoard();
    this.renderBoard();
    this.saveState();

    if (value !== null && window.GameAudio) {
      window.GameAudio.playMerge(value * 2); // small feedback tone
    }

    this.checkWin();
  }

  getHint() {
    if (this.won) return;
    if (window.GameAudio) window.GameAudio.playClick();

    // Find all empty or wrong cells
    const candidates = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.staticCells[r][c] && (this.grid[r][c] === null || this.grid[r][c] !== this.solved[r][c])) {
          candidates.push({ row: r, col: c });
        }
      }
    }

    if (candidates.length > 0) {
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      const { row, col } = choice;

      this.grid[row][col] = this.solved[row][col];
      this.selectCell(row, col);
      this.validateBoard();
      this.renderBoard();
      this.saveState();

      if (window.Confetti) {
        window.Confetti.burst(window.innerWidth / 2, window.innerHeight / 2 - 100, 15);
      }
      this.checkWin();
    }
  }

  resetBoard() {
    if (window.GameAudio) window.GameAudio.playClick();
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.staticCells[r][c]) {
          this.grid[r][c] = null;
        }
      }
    }
    this.validateBoard();
    this.renderBoard();
    this.selectFirstEmptyCell();
    this.saveState();
  }

  updateUI() {
    this.renderBoard();
    this.renderKeypad();
    this.updateWinsUI();
  }

  loadWins() {
    try {
      const savedWins = localStorage.getItem('zoo_sudoku_wins');
      if (savedWins) {
        this.wins = JSON.parse(savedWins);
      } else {
        this.wins = { 4: 0, 6: 0, 9: 0 };
      }
    } catch(e) {
      this.wins = { 4: 0, 6: 0, 9: 0 };
    }
  }

  saveWins() {
    try {
      localStorage.setItem('zoo_sudoku_wins', JSON.stringify(this.wins));
    } catch(e) {}
  }

  updateWinsUI() {
    const labelEl = document.getElementById('sudoku-wins-label');
    const valueEl = document.getElementById('sudoku-wins-value');
    if (labelEl) {
      labelEl.textContent = `ПОБЕД ${this.boardSize}x${this.boardSize}`;
    }
    if (valueEl) {
      valueEl.textContent = this.wins[this.boardSize] || 0;
    }
  }

  checkWin() {
    const totalCells = this.boardSize * this.boardSize;
    if (this.errorCount === 0 && this.progressCount === totalCells && !this.won) {
      this.won = true;
      
      // Increment wins for current board size
      this.wins[this.boardSize] = (this.wins[this.boardSize] || 0) + 1;
      this.saveWins();
      this.updateWinsUI();

      setTimeout(() => {
        if (window.GameAudio) window.GameAudio.playWin();
        if (window.Confetti) window.Confetti.celebrate(4500);

        const winTitle = document.getElementById('win-title');
        const winModal = document.getElementById('game-win-modal');
        const modalText = winModal.querySelector('p');

        const originalTitle = winTitle.innerHTML;
        const originalText = modalText.innerHTML;

        winTitle.innerHTML = 'Ты решил Судоку! 🎉🐾';
        modalText.innerHTML = 'Потрясающая работа! Ты правильно расставил всех зверей и цифры!';

        const continueBtn = winModal.querySelector('.btn-primary');
        const restartBtn = winModal.querySelector('.btn-pill.active');
        const originalRestartAction = restartBtn ? restartBtn.getAttribute('onclick') : null;

        if (restartBtn) {
          restartBtn.removeAttribute('onclick');
          restartBtn.onclick = () => {
            if (window.GameAudio) window.GameAudio.playClick();
            winModal.classList.add('hidden');
            winTitle.innerHTML = originalTitle;
            modalText.innerHTML = originalText;
            if (continueBtn) {
              continueBtn.textContent = 'Продолжить! 💖';
              continueBtn.onclick = null;
              continueBtn.setAttribute('onclick', "app.closeWinModal(false)");
            }
            
            // Restore original attributes/state
            restartBtn.onclick = null;
            restartBtn.setAttribute('onclick', originalRestartAction);
            
            this.startNewGame();
          };
        }

        if (continueBtn) {
          continueBtn.classList.remove('hidden');
          continueBtn.textContent = 'Посмотреть поле 👀';
          continueBtn.onclick = () => {
            if (window.GameAudio) window.GameAudio.playClick();
            winModal.classList.add('hidden');
            winTitle.innerHTML = originalTitle;
            modalText.innerHTML = originalText;
            continueBtn.textContent = 'Продолжить! 💖';
            
            continueBtn.onclick = null;
            continueBtn.setAttribute('onclick', "app.closeWinModal(false)");
            if (restartBtn) {
              restartBtn.onclick = null;
              restartBtn.setAttribute('onclick', originalRestartAction);
            }
          };
        }

        winModal.classList.remove('hidden');
      }, 350);
    }
  }

  bindEvents() {
    const restartBtn = document.getElementById('sudoku-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.startNewGame());
    }

    const hintBtn = document.getElementById('sudoku-hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.getHint());
    }

    const resetBtn = document.getElementById('sudoku-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetBoard());
    }

    // Keyboard bindings 1-9 or Backspace/Delete to erase
    window.addEventListener('keydown', (e) => {
      if (window.portal && window.portal.activeGame !== 'sudoku') return;
      if (!this.selectedCell || this.won) return;

      if (e.key >= '1' && e.key <= String(this.boardSize)) {
        this.setCellValue(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.setCellValue(null);
      }
    });
  }
}

window.AppSudoku = new AppSudokuClass();
