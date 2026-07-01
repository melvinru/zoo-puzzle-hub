// --- Kids Zoo Math Crossword Game Engine ---

const CROSSWORD_TILES = {
  0: { emoji: '🐵', name: '0', color: '#FFFACD' },
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

const CROSSWORD_TEMPLATES_5 = [
  [11, 2, 13, 7, 3, 4, 4, 5, 9],
  [13, 2, 15, 12, 5, 7, 1, 7, 8],
  [9, 5, 14, 8, 4, 4, 1, 9, 10],
  [10, 8, 18, 7, 2, 5, 3, 10, 13],
  [13, 3, 16, 11, 10, 1, 2, 13, 15],
  [13, 3, 16, 8, 4, 4, 5, 7, 12],
  [13, 4, 17, 7, 2, 5, 6, 6, 12],
  [12, 6, 18, 10, 5, 5, 2, 11, 13]
];

const CROSSWORD_TEMPLATES_7 = [
  [5, 3, 6, 2, 6, 2, 5, 9, 8, 2, 1, 9, 3, 3, 2, 2],
  [1, 5, 3, 3, 4, 5, 2, 1, 4, 6, 7, 3, 1, 4, 8, 5],
  [7, 4, 3, 8, 2, 5, 8, 5, 3, 5, 7, 1, 6, 4, 2, 4],
  [7, 6, 7, 6, 2, 6, 7, 3, 5, 5, 8, 2, 4, 7, 8, 5],
  [7, 4, 3, 8, 6, 2, 3, 7, 9, 3, 6, 6, 4, 3, 6, 7],
  [5, 5, 8, 2, 1, 1, 5, 5, 4, 3, 1, 6, 2, 3, 4, 3],
  [7, 6, 9, 4, 3, 5, 9, 7, 2, 5, 1, 6, 8, 6, 1, 3],
  [3, 4, 5, 2, 8, 8, 7, 7, 6, 5, 5, 6, 5, 7, 3, 1]
];

const CELL_TYPES_5 = [
  ['N', 'O', 'N', 'O', 'N'],
  ['O', 'E', 'O', 'E', 'O'],
  ['N', 'O', 'N', 'O', 'N'],
  ['O', 'E', 'O', 'E', 'O'],
  ['N', 'O', 'N', 'O', 'N']
];

const OPERATORS_5 = [
  [null, '+',  null, '=',  null],
  ['-',  null, '+',  null, '-'],
  [null, '-',  null, '=',  null],
  ['=',  null, '=',  null, '='],
  [null, '+',  null, '=',  null]
];

const MAPPING_5 = [
  [0, null, 1, null, 2],
  [null, null, null, null, null],
  [3, null, 4, null, 5],
  [null, null, null, null, null],
  [6, null, 7, null, 8]
];

const CELL_TYPES_7 = [
  ['N', 'O', 'N', 'O', 'N', 'O', 'N'],
  ['O', 'E', 'O', 'E', 'O', 'E', 'O'],
  ['N', 'O', 'N', 'O', 'N', 'O', 'N'],
  ['O', 'E', 'O', 'E', 'O', 'E', 'O'],
  ['N', 'O', 'N', 'O', 'N', 'O', 'N'],
  ['O', 'E', 'O', 'E', 'O', 'E', 'O'],
  ['N', 'O', 'N', 'O', 'N', 'O', 'N']
];

const OPERATORS_7 = [
  [null, '+',  null, '-',  null, '=',  null],
  ['+',  null, '+',  null, '-',  null, '-'],
  [null, '-',  null, '+',  null, '=',  null],
  ['-',  null, '-',  null, '+',  null, '+'],
  [null, '+',  null, '-',  null, '=',  null],
  ['=',  null, '=',  null, '=',  null, '='],
  [null, '-',  null, '+',  null, '=',  null]
];

const MAPPING_7 = [
  [0, null, 1, null, 2, null, 3],
  [null, null, null, null, null, null, null],
  [4, null, 5, null, 6, null, 7],
  [null, null, null, null, null, null, null],
  [8, null, 9, null, 10, null, 11],
  [null, null, null, null, null, null, null],
  [12, null, 13, null, 14, null, 15]
];

class AppCrosswordClass {
  constructor() {
    this.boardSize = 5; // default: 5 (Easy)
    this.grid = []; // 2D array of values (operators, clues, user values, nulls)
    this.solved = []; // 2D solved solution grid
    this.staticCells = []; // 2D array of booleans (true if clue or operator)
    this.errors = []; // 2D array of booleans (true if incorrect input)
    this.selectedCell = null; // { row, col } of selected cell
    this.errorCount = 0;
    this.progressCount = 0;
    this.won = false;
    this.wins = { 5: 0, 7: 0 };
  }

  init() {
    this.bindEvents();
    this.loadWins();
    this.updateWinsUI();

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

    try {
      localStorage.setItem('zoo_crossword_board_size', this.boardSize);
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
    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;
    
    // Collect all number cells
    const numCells = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N') {
          numCells.push({ r, col: c });
        }
      }
    }
    
    // Shuffle number cells
    for (let i = numCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numCells[i], numCells[j]] = [numCells[j], numCells[i]];
    }

    const blankCount = this.boardSize === 5 ? 4 : 5;
    
    this.grid = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    this.staticCells = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(true));
    this.solved = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));

    const templates = this.boardSize === 5 ? CROSSWORD_TEMPLATES_5 : CROSSWORD_TEMPLATES_7;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const mapping = this.boardSize === 5 ? MAPPING_5 : MAPPING_7;
    const operators = this.boardSize === 5 ? OPERATORS_5 : OPERATORS_7;

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N') {
          const valIdx = mapping[r][c];
          const correctVal = template[valIdx];
          this.solved[r][c] = correctVal;
          this.grid[r][c] = correctVal;
        } else if (cellTypes[r][c] === 'O') {
          this.grid[r][c] = operators[r][c];
        }
      }
    }

    // Blank out selected cells
    for (let i = 0; i < blankCount; i++) {
      const { r, col } = numCells[i];
      this.grid[r][col] = null;
      this.staticCells[r][col] = false;
    }

    this.selectedCell = null;
    this.validateBoard();
    this.renderBoard();
    this.renderKeypad();
    this.selectFirstEmptyCell();
    this.saveState();
  }

  saveState() {
    try {
      localStorage.setItem('zoo_crossword_board_size', this.boardSize);
      localStorage.setItem(`zoo_crossword_grid_${this.boardSize}`, JSON.stringify(this.grid));
      localStorage.setItem(`zoo_crossword_solved_${this.boardSize}`, JSON.stringify(this.solved));
      localStorage.setItem(`zoo_crossword_static_${this.boardSize}`, JSON.stringify(this.staticCells));
    } catch (e) {
      console.warn("Could not save Crossword state:", e);
    }
  }

  loadState() {
    try {
      const savedSize = localStorage.getItem('zoo_crossword_board_size');
      if (savedSize) {
        this.boardSize = parseInt(savedSize);
      }
      const savedGrid = localStorage.getItem(`zoo_crossword_grid_${this.boardSize}`);
      const savedSolved = localStorage.getItem(`zoo_crossword_solved_${this.boardSize}`);
      const savedStatic = localStorage.getItem(`zoo_crossword_static_${this.boardSize}`);
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
    } catch (e) {
      console.warn("Could not load Crossword state:", e);
    }
    return false;
  }

  validateBoard() {
    if (!this.grid || this.grid.length === 0) return;
    this.errors = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
    let errorCount = 0;
    let filledCount = 0;
    let totalInputCells = 0;
    
    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N') {
          if (!this.staticCells[r][c]) {
            totalInputCells++;
            const val = this.grid[r][c];
            if (val !== null) {
              filledCount++;
              if (val !== this.solved[r][c]) {
                this.errors[r][c] = true;
                errorCount++;
              }
            }
          }
        }
      }
    }

    this.errorCount = errorCount;
    this.progressCount = filledCount;

    // Update UI Stats
    const errEl = document.getElementById('crossword-stat-errors');
    if (errEl) errEl.textContent = errorCount;
    
    const progEl = document.getElementById('crossword-stat-progress');
    if (progEl) progEl.textContent = `${filledCount} / ${totalInputCells}`;

    // Update Status Banner
    const banner = document.getElementById('crossword-status-banner');
    if (banner) {
      if (errorCount > 0) {
        banner.className = 'fifteen-banner unsolvable';
        banner.textContent = 'Есть ошибки! Проверьте ваши ответы. ❌';
      } else if (filledCount === totalInputCells) {
        banner.className = 'fifteen-banner solvable';
        banner.textContent = 'Отличная работа! Все правильно! 🎉';
      } else {
        banner.className = 'fifteen-banner solvable';
        banner.textContent = 'Заполните пустые клетки! ⚡';
      }
    }
  }

  renderBoard() {
    if (!this.grid || this.grid.length === 0) return;
    const board = document.getElementById('crossword-board');
    if (!board) return;
    board.innerHTML = '';

    board.className = `board grid-${this.boardSize}x${this.boardSize}`;
    board.style.setProperty('--grid-size', this.boardSize);

    // DUP-05: use shared getGameMode
    const mode = getGameMode();
    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        const val = this.grid[r][c];
        const cell = document.createElement('div');
        
        const type = cellTypes[r][c];
        if (type === 'E') {
          cell.className = 'crossword-cell crossword-empty';
        } else if (type === 'O') {
          cell.className = 'crossword-cell crossword-operator';
          cell.textContent = val;
        } else if (type === 'N') {
          cell.className = 'crossword-cell crossword-input-slot';
          
          if (this.staticCells[r][c]) {
            cell.classList.add('crossword-static');
          } else if (val !== null) {
            cell.classList.add('crossword-user-filled');
          }

          if (this.selectedCell && this.selectedCell.row === r && this.selectedCell.col === c) {
            cell.classList.add('selected');
          }

          if (this.errors[r][c]) {
            cell.classList.add('crossword-error');
          }

          if (val !== null) {
            const inner = document.createElement('div');
            inner.className = 'tile-inner';
            
            if (mode === 'animals') {
              const strVal = String(val);
              const icon = document.createElement('span');
              icon.className = 'tile-icon';
              icon.textContent = strVal.split('').map(d => CROSSWORD_TILES[parseInt(d)].emoji).join('');
              if (strVal.length > 1) {
                icon.style.fontSize = 'clamp(1.1rem, 4.5vw, 1.65rem)'; // slightly smaller for side-by-side emojis
              }
              
              const label = document.createElement('span');
              label.className = 'tile-label';
              label.textContent = strVal;
              
              inner.appendChild(icon);
              inner.appendChild(label);
            } else {
              const num = document.createElement('span');
              num.className = 'tile-number';
              const strVal = String(val);
              if (strVal.length > 1) {
                num.style.fontSize = 'clamp(1.1rem, 4.5vw, 1.65rem)'; // slightly smaller for 2 digits
              }
              num.textContent = val;
              inner.appendChild(num);
            }
            cell.appendChild(inner);
          }

          cell.addEventListener('click', () => {
            if (window.GameAudio) window.GameAudio.playSwipe();
            this.selectCell(r, c);
          });
        }
        board.appendChild(cell);
      }
    }
  }

  renderKeypad() {
    const keypad = document.getElementById('crossword-keypad');
    if (!keypad) return;
    // DUP-05: use shared getGameMode
    const mode = getGameMode();

    // DUP-02: use shared renderKeypadButtons
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    renderKeypadButtons(keypad, CROSSWORD_TILES, nums, mode, (val) => {
      if (window.GameAudio) window.GameAudio.playClick();
      this.setCellValue(val);
    }, '', null);

    // DUP-02: use shared appendEraseButton
    appendEraseButton(keypad, () => {
      if (window.GameAudio) window.GameAudio.playClick();
      this.setCellValue(null);
    }, { flex: '1 1 100%', marginTop: '6px', minHeight: '42px' });
  }

  selectCell(row, col) {
    if (this.staticCells[row][col]) return;
    this.selectedCell = { row, col };
    this.renderBoard();
  }

  selectFirstEmptyCell() {
    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N' && !this.staticCells[r][c] && this.grid[r][c] === null) {
          this.selectedCell = { row: r, col: c };
          return;
        }
      }
    }
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N' && !this.staticCells[r][c]) {
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

    if (value === null) {
      this.grid[row][col] = null;
    } else {
      const current = this.grid[row][col];
      if (current === null || String(current).length >= 2) {
        // Start a new number (overwrite)
        this.grid[row][col] = value;
      } else {
        // Append digit (e.g. 1 then 3 becomes 13)
        this.grid[row][col] = current * 10 + value;
      }
    }
    
    this.validateBoard();
    this.renderBoard();
    this.saveState();

    if (value !== null && window.GameAudio) {
      window.GameAudio.playMerge(value * 2);
    }

    this.checkWin();
  }

  getHint() {
    if (this.won) return;
    if (window.GameAudio) window.GameAudio.playClick();

    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;
    const candidates = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N' && !this.staticCells[r][c] && (this.grid[r][c] === null || this.grid[r][c] !== this.solved[r][c])) {
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
    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N' && !this.staticCells[r][c]) {
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
    // DUP-03: use shared createWinsStorage
    const storage = createWinsStorage('zoo_crossword_wins', { 5: 0, 7: 0 });
    this.wins = storage.load();
  }

  saveWins() {
    // DUP-03: use shared createWinsStorage
    const storage = createWinsStorage('zoo_crossword_wins', { 5: 0, 7: 0 });
    storage.save(this.wins);
  }

  updateWinsUI() {
    const labelEl = document.getElementById('crossword-wins-label');
    const valueEl = document.getElementById('crossword-wins-value');
    if (labelEl) {
      labelEl.textContent = `ПОБЕД ${this.boardSize}x${this.boardSize}`;
    }
    if (valueEl) {
      valueEl.textContent = this.wins[this.boardSize] || 0;
    }
  }

  checkWin() {
    const cellTypes = this.boardSize === 5 ? CELL_TYPES_5 : CELL_TYPES_7;
    let totalInputCells = 0;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (cellTypes[r][c] === 'N' && !this.staticCells[r][c]) {
          totalInputCells++;
        }
      }
    }

    if (this.errorCount === 0 && this.progressCount === totalInputCells && !this.won) {
      this.won = true;
      
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

        winTitle.innerHTML = 'Ты решил Кроссворд! 🎉🧮';
        modalText.innerHTML = 'Потрясающая работа! Ты правильно решил все уравнения!';

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
    const restartBtn = document.getElementById('crossword-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.startNewGame());
    }

    const hintBtn = document.getElementById('crossword-hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.getHint());
    }

    const resetBtn = document.getElementById('crossword-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetBoard());
    }

    window.addEventListener('keydown', (e) => {
      if (window.portal && window.portal.activeGame !== 'crossword') return;
      if (!this.selectedCell || this.won) return;

      if (e.key >= '0' && e.key <= '9') {
        this.setCellValue(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.setCellValue(null);
      }
    });
  }
}

window.AppCrossword = new AppCrosswordClass();
