// --- Game Constants & Mappings ---
const ANIMAL_TILES = {
  2: { emoji: '🥚', name: '2', color: '#FFF0F5' },
  4: { emoji: '🐣', name: '4', color: '#FFE4E1' },
  8: { emoji: '🐰', name: '8', color: '#FFDAB9' },
  16: { emoji: '🐱', name: '16', color: '#FFFACD' },
  32: { emoji: '🐶', name: '32', color: '#E0FFF3' },
  64: { emoji: '🐷', name: '64', color: '#E6FAFF' },
  128: { emoji: '🐼', name: '128', color: '#E6E6FA' },
  256: { emoji: '🐨', name: '256', color: '#F4E6FF' },
  512: { emoji: '🐵', name: '512', color: '#FFF0F5' },
  1024: { emoji: '🦁', name: '1024', color: '#FFEBEB' },
  2048: { emoji: '🦄', name: '2048', color: '#FFF9E6' },
  4096: { emoji: '🐉', name: '4096', color: '#E6FFF9' }
};

class Tile {
  constructor(row, col, value) {
    this.row = row;
    this.col = col;
    this.value = value;
    this.id = Tile.nextId++;
    this.domElement = null;
    this.mergedInto = null;
    this.isNew = true;
    this.isMerged = false;
  }
}
Tile.nextId = 0;

const App = {
  boardSize: 3, // Default 3x3 for kids
  gameMode: 'animals', // 'animals' or 'numbers'
  theme: 'candy',
  score: 0,
  bestScores: { 3: 0, 4: 0 },
  grid: [], // 2D array of Tile objects or null
  isMoving: false,
  won: false,
  keepPlayingAfterWin: false,
  highestUnlocked: 2,
  isGameOver: false,
  
  // Touch swipe coordinates
  touchStartClientX: 0,
  touchStartClientY: 0,

  init() {
    // 1. Load settings and stats from localStorage
    this.loadState();

    // 2. Setup theme CSS class
    document.body.className = `theme-${this.theme}`;
    this.updateThemeSelectorUI();

    // 3. Initialize Confetti
    const canvas = document.getElementById('confetti-canvas');
    if (window.Confetti && canvas) {
      window.Confetti.init(canvas);
    }

    // 4. Bind DOM Controls & Listeners
    this.bindEvents();

    // 5. Draw background cell structure
    this.setupBackgroundGrid();

    // 6. Start or restore board
    this.startOrRestoreGame();

    // 7. Render evolution guide
    this.renderEvolutionGuide();
  },

  loadState() {
    try {
      this.boardSize = parseInt(localStorage.getItem('zoo2048_board_size')) || 3;
      this.gameMode = localStorage.getItem('zoo2048_game_mode') || 'animals';
      this.theme = localStorage.getItem('zoo2048_theme') || 'candy';
      this.bestScores[3] = parseInt(localStorage.getItem('zoo2048_best_score_3')) || 0;
      this.bestScores[4] = parseInt(localStorage.getItem('zoo2048_best_score_4')) || 0;
      this.highestUnlocked = parseInt(localStorage.getItem('zoo2048_highest_unlocked')) || 2;
      
      this.loadSizeSpecificState();
    } catch (e) {
      console.warn("Could not load state from localStorage:", e);
    }

    // Update buttons state
    this.updateToggleButtonsUI();
    this.updateScoreUI();
  },

  loadSizeSpecificState() {
    try {
      const savedScore = localStorage.getItem(`zoo2048_current_score_${this.boardSize}`);
      if (savedScore !== null) {
        this.score = parseInt(savedScore);
      } else {
        // Fallback to legacy single key
        const legacyScore = localStorage.getItem('zoo2048_current_score');
        if (legacyScore !== null) this.score = parseInt(legacyScore);
        else this.score = 0;
      }
      
      const savedWon = localStorage.getItem(`zoo2048_won_${this.boardSize}`);
      if (savedWon !== null) {
        this.won = savedWon === 'true';
      } else {
        const legacyWon = localStorage.getItem('zoo2048_won');
        this.won = legacyWon === 'true';
      }
      
      const savedKeepPlaying = localStorage.getItem(`zoo2048_keep_playing_${this.boardSize}`);
      if (savedKeepPlaying !== null) {
        this.keepPlayingAfterWin = savedKeepPlaying === 'true';
      } else {
        const legacyKeepPlaying = localStorage.getItem('zoo2048_keep_playing');
        this.keepPlayingAfterWin = legacyKeepPlaying === 'true';
      }

      const savedGameOver = localStorage.getItem(`zoo2048_is_game_over_${this.boardSize}`);
      this.isGameOver = savedGameOver === 'true';
    } catch (e) {
      console.warn("Could not load size specific state:", e);
    }
  },

  saveState() {
    try {
      localStorage.setItem('zoo2048_board_size', this.boardSize);
      localStorage.setItem('zoo2048_game_mode', this.gameMode);
      localStorage.setItem('zoo2048_theme', this.theme);
      localStorage.setItem('zoo2048_best_score_3', this.bestScores[3]);
      localStorage.setItem('zoo2048_best_score_4', this.bestScores[4]);
      localStorage.setItem('zoo2048_highest_unlocked', this.highestUnlocked);
      
      // Size-specific settings
      localStorage.setItem(`zoo2048_current_score_${this.boardSize}`, this.score);
      localStorage.setItem(`zoo2048_won_${this.boardSize}`, this.won);
      localStorage.setItem(`zoo2048_keep_playing_${this.boardSize}`, this.keepPlayingAfterWin);
      localStorage.setItem(`zoo2048_is_game_over_${this.boardSize}`, this.isGameOver);
      
      // Save grid serialization
      const serializedGrid = this.grid.map(row => 
        row.map(tile => tile ? { row: tile.row, col: tile.col, value: tile.value } : null)
      );
      localStorage.setItem(`zoo2048_board_state_${this.boardSize}`, JSON.stringify(serializedGrid));
    } catch (e) {
      console.warn("Could not save state to localStorage:", e);
    }
  },

  startOrRestoreGame() {
    // setupBackgroundGrid() already clears innerHTML internally (BUG-01 fix)
    this.setupBackgroundGrid();
    
    let restored = false;
    try {
      let savedState = localStorage.getItem(`zoo2048_board_state_${this.boardSize}`);
      if (!savedState) {
        // Fallback to legacy key if size matches
        const legacySize = parseInt(localStorage.getItem('zoo2048_board_size'));
        if (legacySize === this.boardSize) {
          savedState = localStorage.getItem('zoo2048_board_state');
        }
      }
      
      if (savedState) {
        const rawGrid = JSON.parse(savedState);
        if (rawGrid && rawGrid.length === this.boardSize) {
          this.grid = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
          
          rawGrid.forEach((rowArr, r) => {
            rowArr.forEach((cell, c) => {
              if (cell) {
                const tile = new Tile(cell.row, cell.col, cell.value);
                tile.isNew = false;
                this.grid[r][c] = tile;
                this.createTileDOM(tile);
              }
            });
          });
          restored = true;
        }
      }
    } catch (e) {
      console.warn("Could not restore grid state, starting fresh:", e);
    }

    if (restored) {
      if (this.isGameOver) {
        this.showGameOverModal();
      } else if (this.won && !this.keepPlayingAfterWin) {
        this.showWinModal();
      }
    } else {
      this.restartGame(false); // Restart fresh without confirmation
    }
  },

  restartGame(confirm = true) {
    if (confirm) {
      this.confirmRestart();
    } else {
      this.resetBoardState();
    }
  },

  resetBoardState() {
    this.score = 0;
    this.won = false;
    this.keepPlayingAfterWin = false;
    this.isGameOver = false;
    
    // Hide any open modals
    document.getElementById('restart-confirm-modal').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('game-win-modal').classList.add('hidden');

    // Clear DOM tiles
    const board = document.getElementById('game-board');
    const existingTiles = board.querySelectorAll('.tile');
    existingTiles.forEach(t => t.remove());

    // Initialize blank grid
    this.grid = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
    
    // Spawn two starting tiles
    this.spawnRandomTile();
    this.spawnRandomTile();

    this.updateScoreUI();
    this.saveState();
    this.renderEvolutionGuide();
  },

  setupBackgroundGrid() {
    const board = document.getElementById('game-board');
    // BUG-01: clear first to prevent duplicate cells on repeated calls
    board.innerHTML = '';
    board.className = `board grid-${this.boardSize}x${this.boardSize}`;

    // Set custom CSS variables on board
    board.style.setProperty('--grid-size', this.boardSize);

    // Inject background cell divs
    const cellCount = this.boardSize * this.boardSize;
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      board.appendChild(cell);
    }
  },

  spawnRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.grid[r][c]) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      // 90% chance of Egg (2), 10% chance of Chick (4)
      const value = Math.random() < 0.9 ? 2 : 4;
      const tile = new Tile(randomCell.r, randomCell.c, value);
      this.grid[randomCell.r][randomCell.c] = tile;
      this.createTileDOM(tile);
    }
  },

  createTileDOM(tile) {
    const board = document.getElementById('game-board');
    const div = document.createElement('div');
    div.className = `tile tile-v-${tile.value}`;
    if (this.gameMode === 'numbers') {
      div.classList.add('number-mode');
    }
    if (tile.isNew) {
      div.classList.add('tile-new');
    }

    div.style.setProperty('--row', tile.row);
    div.style.setProperty('--col', tile.col);

    // DUP-01: use shared createTileInner utility
    div.appendChild(createTileInner(tile.value, ANIMAL_TILES, this.gameMode));
    board.appendChild(div);
    tile.domElement = div;
  },

  updateTileDOM(tile) {
    if (!tile.domElement) return;

    // Update coordinates variables (triggers CSS slide transition)
    tile.domElement.style.setProperty('--row', tile.row);
    tile.domElement.style.setProperty('--col', tile.col);

    // If tile value changed (merged) — update visual content
    if (tile.isMerged) {
      tile.domElement.className = `tile tile-v-${tile.value} tile-merge`;
      if (this.gameMode === 'numbers') {
        tile.domElement.classList.add('number-mode');
      }

      // DUP-01: replace old inner with fresh one via shared utility
      const oldInner = tile.domElement.querySelector('.tile-inner');
      const newInner = createTileInner(tile.value, ANIMAL_TILES, this.gameMode);
      if (oldInner) {
        tile.domElement.replaceChild(newInner, oldInner);
      } else {
        tile.domElement.appendChild(newInner);
      }
    }
  },

  move(direction) {
    if (window.portal && window.portal.activeGame !== '2048') return;
    if (this.isMoving) return;
    if (this.isGameOver) return;
    
    // Check if modals are open
    if (!document.getElementById('restart-confirm-modal').classList.contains('hidden') ||
        !document.getElementById('game-over-modal').classList.contains('hidden') ||
        !document.getElementById('game-win-modal').classList.contains('hidden')) {
      return;
    }

    const vectors = {
      up: { row: -1, col: 0 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
      right: { row: 0, col: 1 }
    };

    const vector = vectors[direction];
    if (!vector) return;

    this.isMoving = true;
    let moved = false;
    this.highestValueThisMove = 0;

    // Reset merged and new states on all existing tiles
    this.grid.forEach(row => {
      row.forEach(tile => {
        if (tile) {
          tile.isMerged = false;
          tile.isNew = false;
          tile.mergedInto = null;
        }
      });
    });

    const traversals = this.getTraversals(vector);
    
    traversals.rows.forEach(r => {
      traversals.cols.forEach(c => {
        const tile = this.grid[r][c];
        if (tile) {
          const positions = this.findFarthestPosition(r, c, vector);
          const next = positions.next;
          
          let merged = false;
          if (this.withinBounds(next)) {
            const nextTile = this.grid[next.row][next.col];
            if (nextTile && nextTile.value === tile.value && !nextTile.isMerged) {
              merged = true;
              
              // Move sliding tile to target coordinates visually
              tile.mergedInto = nextTile;
              tile.row = next.row;
              tile.col = next.col;
              
              // Clear current cell, update target
              this.grid[r][c] = null;
              nextTile.value *= 2;
              nextTile.isMerged = true;
              
              this.score += nextTile.value;
              if (nextTile.value > this.highestValueThisMove) {
                this.highestValueThisMove = nextTile.value;
              }
              
              // Update DOM element visually sliding
              tile.domElement.style.setProperty('--row', tile.row);
              tile.domElement.style.setProperty('--col', tile.col);
              tile.domElement.classList.add('tile-merged-out');
              tile.domElement.style.zIndex = '5';
              
              moved = true;
            }
          }
          
          if (!merged) {
            if (positions.farthest.row !== r || positions.farthest.col !== c) {
              // Move tile
              this.grid[r][c] = null;
              tile.row = positions.farthest.row;
              tile.col = positions.farthest.col;
              this.grid[tile.row][tile.col] = tile;
              
              this.updateTileDOM(tile);
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      // Play swipe sound
      if (window.GameAudio) {
        window.GameAudio.playSwipe();
      }

      // Allow animations to finish sliding
      setTimeout(() => {
        // Clean up merged-out DOM elements
        const board = document.getElementById('game-board');
        const mergedOut = board.querySelectorAll('.tile-merged-out');
        mergedOut.forEach(el => el.remove());

        // Update grid DOM elements with final merged state
        let mergeHappened = false;
        let milestoneReached = false;
        let milestoneValue = 2;

        this.grid.forEach(row => {
          row.forEach(tile => {
            if (tile) {
              if (tile.isMerged) {
                this.updateTileDOM(tile);
                mergeHappened = true;
                
                // Track highest unlocked
                if (tile.value > this.highestUnlocked) {
                  this.highestUnlocked = tile.value;
                  milestoneReached = true;
                  milestoneValue = tile.value;
                }
              }
            }
          });
        });

        // Play sounds & rewards
        if (mergeHappened) {
          if (window.GameAudio) {
            window.GameAudio.playMerge(this.highestValueThisMove);
          }
        }

        // Spawn next random tile
        this.spawnRandomTile();
        this.updateScoreUI();
        this.saveState();
        this.renderEvolutionGuide();

        // Milestone rewards
        if (milestoneReached) {
          this.triggerMilestone(milestoneValue);
        }

        // Check Win/Game Over conditions
        this.checkGameStatus();
        this.isMoving = false;
      }, 160); // Match CSS transition timing
    } else {
      this.isMoving = false;
    }
  },

  getTraversals(vector) {
    const traversals = { rows: [], cols: [] };
    for (let i = 0; i < this.boardSize; i++) {
      traversals.rows.push(i);
      traversals.cols.push(i);
    }
    if (vector.row === 1) traversals.rows.reverse(); // Slide Down
    if (vector.col === 1) traversals.cols.reverse(); // Slide Right
    return traversals;
  },

  findFarthestPosition(row, col, vector) {
    let previous;
    do {
      previous = { row, col };
      row += vector.row;
      col += vector.col;
    } while (this.withinBounds({ row, col }) && this.cellEmpty({ row, col }));

    return {
      farthest: previous,
      next: { row, col }
    };
  },

  withinBounds(pos) {
    return pos.row >= 0 && pos.row < this.boardSize &&
           pos.col >= 0 && pos.col < this.boardSize;
  },

  cellEmpty(pos) {
    return !this.grid[pos.row][pos.col];
  },

  checkGameStatus() {
    // 1. Check Win Condition: 2048 (Unicorn) reached
    if (!this.won && !this.keepPlayingAfterWin) {
      // OPT-03: flat().some() — short-circuits on first match
      const reached2048 = this.grid.flat().some(tile => tile?.value === 2048);

      if (reached2048) {
        this.won = true;
        this.saveState();
        setTimeout(() => {
          if (window.GameAudio) window.GameAudio.playWin();
          if (window.Confetti) window.Confetti.celebrate(4000);
          this.showWinModal();
        }, 300);
        return;
      }
    }

    // 2. Check Game Over Condition: no empty cells AND no possible merges
    let gameOver = true;
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.grid[r][c]) {
          gameOver = false;
          break;
        }
        
        // Check adjacent cells for merges
        const adjacent = [
          { r: r - 1, c: c },
          { r: r + 1, c: c },
          { r: r, c: c - 1 },
          { r: r, c: c + 1 }
        ];

        for (let adj of adjacent) {
          if (this.withinBounds({ row: adj.r, col: adj.c })) {
            const adjTile = this.grid[adj.r][adj.c];
            if (adjTile && adjTile.value === this.grid[r][c].value) {
              gameOver = false;
              break;
            }
          }
        }
        if (!gameOver) break;
      }
      if (!gameOver) break;
    }

    if (gameOver) {
      this.isGameOver = true;
      setTimeout(() => {
        if (window.GameAudio) window.GameAudio.playGameOver();
        this.showGameOverModal();
      }, 500);
    }
  },

  // --- UI Updates ---
  updateScoreUI() {
    document.getElementById('current-score').textContent = this.score;
    
    // Update high score
    if (this.score > this.bestScores[this.boardSize]) {
      this.bestScores[this.boardSize] = this.score;
    }
    document.getElementById('best-score').textContent = this.bestScores[this.boardSize];
  },

  updateToggleButtonsUI() {
    // Grid selector state
    document.getElementById('btn-grid-3').classList.toggle('active', this.boardSize === 3);
    document.getElementById('btn-grid-4').classList.toggle('active', this.boardSize === 4);

    // Mode selector state
    document.getElementById('btn-mode-animals').classList.toggle('active', this.gameMode === 'animals');
    document.getElementById('btn-mode-numbers').classList.toggle('active', this.gameMode === 'numbers');
    
    // Subtitle / Label text
    const subtitle = document.getElementById('portal-subtitle');
    if (subtitle) {
      if (this.gameMode === 'animals') {
        subtitle.textContent = "Собери Единорога! 🦄";
      } else {
        subtitle.textContent = "Веселая математика! 🔢";
      }
    }

    const muteIcon = document.getElementById('mute-icon');
    if (muteIcon) {
      if (window.GameAudio && window.GameAudio.muted) {
        muteIcon.textContent = '🔇';
      } else {
        muteIcon.textContent = '🔊';
      }
    }
  },

  renderEvolutionGuide() {
    const guide = document.getElementById('evolution-guide-bar');
    guide.innerHTML = '';
    
    const keys = Object.keys(ANIMAL_TILES).map(Number).sort((a,b)=>a-b);
    
    // Find index of highest unlocked element
    let centerIdx = keys.indexOf(this.highestUnlocked);
    if (centerIdx === -1) centerIdx = 0;
    
    // Calculate a sliding window of size 5 centered on centerIdx
    let startIdx = centerIdx - 2;
    let endIdx = centerIdx + 2;
    
    if (startIdx < 0) {
      endIdx = endIdx - startIdx;
      startIdx = 0;
    }
    if (endIdx >= keys.length) {
      startIdx = startIdx - (endIdx - (keys.length - 1));
      endIdx = keys.length - 1;
    }
    startIdx = Math.max(0, startIdx);
    
    const visibleKeys = keys.slice(startIdx, endIdx + 1);
    
    visibleKeys.forEach((val, idx) => {
      const item = document.createElement('div');
      item.className = 'guide-step';
      if (val <= this.highestUnlocked) {
        item.classList.add('achieved');
      }

      if (this.gameMode === 'animals') {
        item.textContent = `${ANIMAL_TILES[val].emoji} ${ANIMAL_TILES[val].name}`;
      } else {
        item.textContent = val;
      }
      
      guide.appendChild(item);
      
      // Append connector arrow
      if (idx < visibleKeys.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'guide-arrow';
        arrow.textContent = '➔';
        guide.appendChild(arrow);
      }
    });
  },

  triggerMilestone(value) {
    const data = ANIMAL_TILES[value];
    if (!data) return;

    // Confetti burst from center of grid
    if (window.Confetti) {
      window.Confetti.burst(window.innerWidth / 2, window.innerHeight / 2 - 100, 30);
    }
    
    // Play unlock sound arpeggio
    if (window.GameAudio) {
      window.GameAudio.playUnlock();
    }

    // Show floating unlock toast
    const toast = document.getElementById('unlock-toast');
    const tEmoji = document.getElementById('toast-emoji');
    const tName = document.getElementById('toast-name');

    if (this.gameMode === 'animals') {
      tEmoji.textContent = data.emoji;
      tName.textContent = data.name;
    } else {
      tEmoji.textContent = '🌟';
      tName.textContent = `Число ${value}!`;
    }

    toast.classList.add('show');
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 400);
    }, 2500);
  },

  // --- Theme Controller ---
  setTheme(themeName) {
    if (window.GameAudio) window.GameAudio.playClick();
    this.theme = themeName;
    document.body.className = `theme-${themeName}`;
    this.updateThemeSelectorUI();
    this.saveState();
  },

  updateThemeSelectorUI() {
    const dots = document.querySelectorAll('.theme-dot');
    dots.forEach(dot => {
      const isActive = dot.classList.contains(this.theme);
      dot.classList.toggle('active', isActive);
    });
  },

  // --- Sound Toggle ---
  toggleMute() {
    if (window.GameAudio) {
      const isMuted = window.GameAudio.toggleMute();
      this.updateToggleButtonsUI();
      // Play a click sound after unmute to verify
      if (!isMuted) {
        window.GameAudio.playClick();
      }
    }
  },

  // --- Options Change Handlers ---
  setGridSize(size) {
    if (this.boardSize === size) return;
    if (window.GameAudio) window.GameAudio.playClick();
    
    // Switch sizes
    this.boardSize = size;
    this.updateToggleButtonsUI();
    this.loadSizeSpecificState();
    this.updateScoreUI();
    this.startOrRestoreGame();
  },

  setGameMode(mode) {
    if (this.gameMode === mode) return;
    if (window.GameAudio) window.GameAudio.playClick();
    
    this.gameMode = mode;
    this.updateToggleButtonsUI();
    this.renderEvolutionGuide();
    
    // Redraw existing tiles in new mode
    // setupBackgroundGrid() clears board and re-adds background cells (BUG-01 fix)
    this.setupBackgroundGrid();

    this.grid.forEach(row => {
      row.forEach(tile => {
        if (tile) this.createTileDOM(tile);
      });
    });

    this.saveState();
  },

  // --- Modals Handlers ---
  confirmRestart() {
    if (window.GameAudio) window.GameAudio.playClick();
    document.getElementById('restart-confirm-modal').classList.remove('hidden');
  },

  closeRestartModal(proceed) {
    if (window.GameAudio) window.GameAudio.playClick();
    document.getElementById('restart-confirm-modal').classList.add('hidden');
    if (proceed) {
      this.resetBoardState();
    }
  },

  showGameOverModal() {
    document.getElementById('game-over-score').textContent = this.score;
    document.getElementById('game-over-modal').classList.remove('hidden');
  },

  closeGameOverModal() {
    if (window.GameAudio) window.GameAudio.playClick();
    document.getElementById('game-over-modal').classList.add('hidden');
  },

  showWinModal() {
    document.getElementById('game-win-modal').classList.remove('hidden');
  },

  closeWinModal(restart) {
    if (window.GameAudio) window.GameAudio.playClick();
    document.getElementById('game-win-modal').classList.add('hidden');
    if (restart) {
      this.resetBoardState();
    } else {
      this.keepPlayingAfterWin = true;
      this.saveState();
    }
  },

  // --- Event Listeners and input helpers ---
  bindEvents() {
    // 1. Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (this.isMoving) return;
      
      const keyMap = {
        'ArrowUp': 'up',
        'KeyW': 'up',
        'ArrowDown': 'down',
        'KeyS': 'down',
        'ArrowLeft': 'left',
        'KeyA': 'left',
        'ArrowRight': 'right',
        'KeyD': 'right'
      };

      const direction = keyMap[e.code];
      if (direction) {
        e.preventDefault(); // Prevent standard page scroll
        this.move(direction);
      }
    }, { passive: false });

    // 2. Touch Swipes (Mobile/Tablets)
    const board = document.getElementById('game-board-wrapper');
    
    board.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return;
      this.touchStartClientX = e.touches[0].clientX;
      this.touchStartClientY = e.touches[0].clientY;
    }, { passive: true });

    board.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      
      const deltaX = e.changedTouches[0].clientX - this.touchStartClientX;
      const deltaY = e.changedTouches[0].clientY - this.touchStartClientY;
      
      const threshold = 35; // Minimal swipe distance in px
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          this.move(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          this.move(deltaY > 0 ? 'down' : 'up');
        }
      }
    }, { passive: true });
    
    // Prevent default touch dragging scrolling on the board area
    board.addEventListener('touchmove', (e) => {
      // If modal is active or we're moving, allow normal behavior, else prevent bouncing page
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
  }
};

// Global exports for inline HTML onClick handlers
window.app = App;
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
