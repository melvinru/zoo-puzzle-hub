// --- Kids Zoo Math Pyramid Game Engine ---

const PYRAMID_TILES = {
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

const PYRAMID_MASKS_3 = [
  [[0,0], [1,1], [2,0]],
  [[0,0], [1,0], [2,2]],
  [[1,0], [2,0], [2,2]],
  [[1,1], [2,0], [2,2]]
];

const PYRAMID_MASKS_4 = [
  [[0,0], [1,0], [2,1], [3,0], [3,2]],
  [[0,0], [1,1], [2,1], [3,1], [3,3]],
  [[0,0], [1,0], [2,2], [3,1], [3,2]],
  [[0,0], [1,1], [2,0], [3,1], [3,2]],
  [[1,0], [1,1], [3,0], [3,2], [3,3]]
];

const PYRAMID_MASKS_5 = [
  [[0,0], [1,0], [2,2], [3,1], [3,3], [4,0], [4,2], [4,4]],
  [[0,0], [1,1], [2,0], [3,0], [3,2], [4,1], [4,3], [4,4]],
  [[1,0], [1,1], [2,1], [3,1], [3,2], [4,0], [4,2], [4,4]],
  [[0,0], [2,0], [2,2], [3,0], [3,3], [4,1], [4,2], [4,3]]
];

const PYRAMID_MASKS_6 = [
  [[0,0], [1,0], [2,2], [3,1], [3,3], [4,0], [4,2], [4,4], [5,1], [5,3], [5,5]],
  [[0,0], [1,1], [2,0], [3,0], [3,2], [4,1], [4,3], [4,4], [5,0], [5,2], [5,4]],
  [[1,0], [1,1], [2,1], [3,1], [3,2], [4,0], [4,2], [4,4], [5,0], [5,2], [5,5]]
];

class AppPyramidClass {
  constructor() {
    this.boardSize = 3; // default: 3 rows (Easy)
    this.grid = []; // 2D array of values (clues, user values, nulls)
    this.solved = []; // 2D solved solution grid
    this.staticCells = []; // 2D array of booleans (true if clue)
    this.errors = []; // 2D array of booleans (true if incorrect input)
    this.selectedCell = null; // { row, col } of selected cell
    this.errorCount = 0;
    this.progressCount = 0;
    this.won = false;
    this.wins = { 3: 0, 4: 0, 5: 0, 6: 0 };
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
      localStorage.setItem('zoo_pyramid_board_size', this.boardSize);
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
    
    this.grid = Array(this.boardSize).fill(null).map((_, r) => Array(r + 1).fill(null));
    this.staticCells = Array(this.boardSize).fill(null).map((_, r) => Array(r + 1).fill(true));
    this.solved = Array(this.boardSize).fill(null).map((_, r) => Array(r + 1).fill(null));
    this.errors = Array(this.boardSize).fill(null).map((_, r) => Array(r + 1).fill(false));

    // Generate random bottom row
    const maxVal = this.boardSize === 3 ? 9 : (this.boardSize === 4 ? 8 : (this.boardSize === 5 ? 6 : 4));
    for (let c = 0; c < this.boardSize; c++) {
      this.solved[this.boardSize - 1][c] = Math.floor(Math.random() * maxVal) + 1;
    }
    // Calculate parents going up
    for (let r = this.boardSize - 2; r >= 0; r--) {
      for (let c = 0; c <= r; c++) {
        this.solved[r][c] = this.solved[r + 1][c] + this.solved[r + 1][c + 1];
      }
    }

    // Apply chosen mask pattern
    let masks = PYRAMID_MASKS_3;
    if (this.boardSize === 4) masks = PYRAMID_MASKS_4;
    if (this.boardSize === 5) masks = PYRAMID_MASKS_5;
    if (this.boardSize === 6) masks = PYRAMID_MASKS_6;
    const chosenPattern = masks[Math.floor(Math.random() * masks.length)];

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c <= r; c++) {
        const isClue = chosenPattern.some(cell => cell[0] === r && cell[1] === c);
        if (isClue) {
          this.grid[r][c] = this.solved[r][c];
          this.staticCells[r][c] = true;
        } else {
          this.grid[r][c] = null;
          this.staticCells[r][c] = false;
        }
      }
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
      localStorage.setItem('zoo_pyramid_board_size', this.boardSize);
      localStorage.setItem(`zoo_pyramid_grid_${this.boardSize}`, JSON.stringify(this.grid));
      localStorage.setItem(`zoo_pyramid_solved_${this.boardSize}`, JSON.stringify(this.solved));
      localStorage.setItem(`zoo_pyramid_static_${this.boardSize}`, JSON.stringify(this.staticCells));
    } catch (e) {
      console.warn("Could not save Pyramid state:", e);
    }
  }

  loadState() {
    try {
      const savedSize = localStorage.getItem('zoo_pyramid_board_size');
      if (savedSize) {
        this.boardSize = parseInt(savedSize);
      }
      const savedGrid = localStorage.getItem(`zoo_pyramid_grid_${this.boardSize}`);
      const savedSolved = localStorage.getItem(`zoo_pyramid_solved_${this.boardSize}`);
      const savedStatic = localStorage.getItem(`zoo_pyramid_static_${this.boardSize}`);
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
      console.warn("Could not load Pyramid state:", e);
    }
    return false;
  }

  validateBoard() {
    if (!this.grid || this.grid.length === 0) return;
    this.errors = Array(this.boardSize).fill(null).map((_, r) => Array(r + 1).fill(false));
    let errorCount = 0;
    let filledCount = 0;
    let totalInputCells = 0;

    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c <= r; c++) {
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

    this.errorCount = errorCount;
    this.progressCount = filledCount;

    // Update UI Stats
    const errEl = document.getElementById('pyramid-stat-errors');
    if (errEl) errEl.textContent = errorCount;
    
    const progEl = document.getElementById('pyramid-stat-progress');
    if (progEl) progEl.textContent = `${filledCount} / ${totalInputCells}`;

    // Update Status Banner
    const banner = document.getElementById('pyramid-status-banner');
    if (banner) {
      if (errorCount > 0) {
        banner.className = 'fifteen-banner unsolvable';
        banner.textContent = 'Есть ошибки! Проверьте кирпичики. ❌';
      } else if (filledCount === totalInputCells) {
        banner.className = 'fifteen-banner solvable';
        banner.textContent = 'Отличная работа! Все правильно! 🎉';
      } else {
        banner.className = 'fifteen-banner solvable';
        banner.textContent = 'Сложите числа и заполните кирпичики! ⚡';
      }
    }
  }

  renderBoard() {
    if (!this.grid || this.grid.length === 0) return;
    const board = document.getElementById('pyramid-board');
    if (!board) return;
    board.innerHTML = '';

    // Set dynamic brick sizing CSS variables on board
    if (this.boardSize === 3) {
      board.style.setProperty('--brick-width', '82px');
      board.style.setProperty('--brick-height', '58px');
      board.style.setProperty('--brick-font-size', '1.6rem');
      board.style.setProperty('--pyramid-gap', '12px');
    } else if (this.boardSize === 4) {
      board.style.setProperty('--brick-width', '74px');
      board.style.setProperty('--brick-height', '52px');
      board.style.setProperty('--brick-font-size', '1.45rem');
      board.style.setProperty('--pyramid-gap', '10px');
    } else if (this.boardSize === 5) {
      board.style.setProperty('--brick-width', '62px');
      board.style.setProperty('--brick-height', '44px');
      board.style.setProperty('--brick-font-size', '1.25rem');
      board.style.setProperty('--pyramid-gap', '8px');
    } else { // 6 rows
      board.style.setProperty('--brick-width', '52px');
      board.style.setProperty('--brick-height', '38px');
      board.style.setProperty('--brick-font-size', '1.1rem');
      board.style.setProperty('--pyramid-gap', '6px');
    }

    // DUP-05: use shared getGameMode
    const mode = getGameMode();

    for (let r = 0; r < this.boardSize; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = `pyramid-row row-${r}`;

      for (let c = 0; c <= r; c++) {
        const val = this.grid[r][c];
        const cell = document.createElement('div');
        cell.className = 'pyramid-brick';
        
        if (this.staticCells[r][c]) {
          cell.classList.add('pyramid-static');
        } else if (val !== null) {
          cell.classList.add('pyramid-user-filled');
        }

        if (this.selectedCell && this.selectedCell.row === r && this.selectedCell.col === c) {
          cell.classList.add('selected');
        }

        if (this.errors[r][c]) {
          cell.classList.add('error');
        }

        if (val !== null) {
          const inner = document.createElement('div');
          inner.className = 'tile-inner';
          
          if (mode === 'animals') {
            const strVal = String(val);
            const icon = document.createElement('span');
            icon.className = 'tile-icon';
            icon.textContent = strVal.split('').map(d => PYRAMID_TILES[parseInt(d)].emoji).join('');
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

        rowDiv.appendChild(cell);
      }
      board.appendChild(rowDiv);
    }
  }

  renderKeypad() {
    const keypad = document.getElementById('pyramid-keypad');
    if (!keypad) return;
    // DUP-05: use shared getGameMode
    const mode = getGameMode();

    // DUP-02: use shared renderKeypadButtons
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    renderKeypadButtons(keypad, PYRAMID_TILES, nums, mode, (val) => {
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
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c <= r; c++) {
        if (!this.staticCells[r][c] && this.grid[r][c] === null) {
          this.selectedCell = { row: r, col: c };
          return;
        }
      }
    }
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c <= r; c++) {
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

    if (value === null) {
      this.grid[row][col] = null;
    } else {
      const current = this.grid[row][col];
      const maxLength = this.boardSize >= 6 ? 3 : 2;
      if (current === null || String(current).length >= maxLength) {
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

    const candidates = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c <= r; c++) {
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
      for (let c = 0; c <= r; c++) {
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
    // DUP-03: use shared createWinsStorage
    const storage = createWinsStorage('zoo_pyramid_wins', { 3: 0, 4: 0, 5: 0, 6: 0 });
    this.wins = storage.load();
  }

  saveWins() {
    // DUP-03: use shared createWinsStorage
    const storage = createWinsStorage('zoo_pyramid_wins', { 3: 0, 4: 0, 5: 0, 6: 0 });
    storage.save(this.wins);
  }

  updateWinsUI() {
    const labelEl = document.getElementById('pyramid-wins-label');
    const valueEl = document.getElementById('pyramid-wins-value');
    if (labelEl) {
      labelEl.textContent = `ПОБЕД ${this.boardSize} ряда`;
    }
    if (valueEl) {
      valueEl.textContent = this.wins[this.boardSize] || 0;
    }
  }

  checkWin() {
    let totalInputCells = 0;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c <= r; c++) {
        if (!this.staticCells[r][c]) {
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

        winTitle.innerHTML = 'Ты построил Пирамиду! 🎉🔺';
        modalText.innerHTML = 'Потрясающая работа! Все кирпичики сложены правильно!';

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
    const restartBtn = document.getElementById('pyramid-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.startNewGame());
    }

    const hintBtn = document.getElementById('pyramid-hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.getHint());
    }

    const resetBtn = document.getElementById('pyramid-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetBoard());
    }

    window.addEventListener('keydown', (e) => {
      if (window.portal && window.portal.activeGame !== 'pyramid') return;
      if (!this.selectedCell || this.won) return;

      if (e.key >= '0' && e.key <= '9') {
        this.setCellValue(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.setCellValue(null);
      }
    });
  }
}

window.AppPyramid = new AppPyramidClass();
