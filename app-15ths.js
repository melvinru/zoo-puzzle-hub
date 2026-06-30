// --- Zoo 15ths Constants & Mappings ---
const FIFTEEN_ANIMALS = {
  1: { emoji: '🥚', name: '1' },
  2: { emoji: '🐣', name: '2' },
  3: { emoji: '🐰', name: '3' },
  4: { emoji: '🐱', name: '4' },
  5: { emoji: '🐶', name: '5' },
  6: { emoji: '🐷', name: '6' },
  7: { emoji: '🐼', name: '7' },
  8: { emoji: '🐨', name: '8' },
  9: { emoji: '🐵', name: '9' },
  10: { emoji: '🦁', name: '10' },
  11: { emoji: '🦄', name: '11' },
  12: { emoji: '🐉', name: '12' },
  13: { emoji: '🦉', name: '13' },
  14: { emoji: '🐧', name: '14' },
  15: { emoji: '🐸', name: '15' }
};

const hexChars = "0123456789abcdef";
function valToHex(val) { return hexChars[val]; }
function hexToVal(char) { return hexChars.indexOf(char); }

const AppFifteen = {
  mode: 'play', // 'play' or 'setup'
  currentBoard: '0123456789abcdef',
  startBoard: '0123456789abcdef',
  solutionPath: [],
  currentStepIndex: 0,
  isPlaying: false,
  playbackInterval: null,
  playbackSpeed: 500,
  worker: null,

  init() {
    // 1. Setup Board DOM structure
    this.initBoard();

    // 2. Load cached high stats or state if any
    this.restoreSavedState();

    // 3. Bind UI click events
    this.bindEvents();

    // 4. Update board representation
    this.updateUI();
  },

  restoreSavedState() {
    try {
      const saved = localStorage.getItem('zoo15ths_board_state');
      if (saved && saved.length === 16) {
        this.currentBoard = saved;
      }
    } catch (e) {
      console.warn("Could not load 15ths state from localStorage:", e);
    }
  },

  saveState() {
    try {
      localStorage.setItem('zoo15ths_board_state', this.currentBoard);
    } catch (e) {
      console.warn("Could not save 15ths state to localStorage:", e);
    }
  },

  initBoard() {
    const boardEl = document.getElementById("fifteen-board");
    boardEl.innerHTML = "";

    // 1. Create static grid background slots
    for (let i = 0; i < 16; i++) {
      const slot = document.createElement("div");
      slot.className = "fifteen-slot";
      if (i === 0) slot.classList.add("goal-empty");
      boardEl.appendChild(slot);
    }

    // 2. Create tiles (0 is empty space, 1-15 are active tiles)
    for (let val = 0; val < 16; val++) {
      const tile = document.createElement("div");
      tile.className = "fifteen-tile";
      tile.id = `fifteen-tile-${val}`;
      
      // Visual contents wrapper
      const inner = document.createElement("div");
      inner.className = "fifteen-tile-inner";
      tile.appendChild(inner);

      if (val === 0) {
        tile.classList.add("fifteen-empty");
      }

      // Add dropdown selector for setup mode
      const select = document.createElement("select");
      select.className = "fifteen-tile-select";
      for (let optVal = 0; optVal < 16; optVal++) {
        const opt = document.createElement("option");
        opt.value = optVal;
        opt.textContent = optVal === 0 ? "0 (Пусто)" : optVal;
        select.appendChild(opt);
      }

      select.addEventListener("change", (e) => {
        const newVal = parseInt(e.target.value, 10);
        this.handleTileSwap(val, newVal);
      });

      tile.appendChild(select);

      // Tile manual click slide handler
      tile.addEventListener("click", () => {
        if (this.mode === 'setup') return;
        this.slideTileByValue(val);
      });

      boardEl.appendChild(tile);
    }
  },

  handleTileSwap(tileVal, newVal) {
    if (tileVal === newVal) return;
    
    const charVal = valToHex(tileVal);
    const charNew = valToHex(newVal);
    
    const idxVal = this.currentBoard.indexOf(charVal);
    const idxNew = this.currentBoard.indexOf(charNew);
    
    const arr = this.currentBoard.split('');
    arr[idxVal] = charNew;
    arr[idxNew] = charVal;
    
    this.currentBoard = arr.join('');
    
    if (window.GameAudio) window.GameAudio.playClick();
    this.clearSolution();
    this.updateUI();
    this.updateSelectDropdowns();
    this.saveState();
  },

  updateSelectDropdowns() {
    for (let val = 0; val < 16; val++) {
      const tile = document.getElementById(`fifteen-tile-${val}`);
      const select = tile.querySelector(".fifteen-tile-select");
      if (select) {
        // Find which tile value currently occupies the tile-slot position
        const char = valToHex(val);
        const idx = this.currentBoard.indexOf(char);
        select.value = idx; // Select position index
      }
    }
  },

  slideTileByValue(val) {
    if (val === 0) return; // Cannot slide empty space
    
    const currentIdx = this.currentBoard.indexOf(valToHex(val));
    const blankIdx = this.currentBoard.indexOf('0');
    
    const rTile = currentIdx >> 2;
    const cTile = currentIdx & 3;
    const rBlank = blankIdx >> 2;
    const cBlank = blankIdx & 3;
    
    // Check Manhattan adjacency
    if (Math.abs(rTile - rBlank) + Math.abs(cTile - cBlank) === 1) {
      const arr = this.currentBoard.split('');
      arr[blankIdx] = valToHex(val);
      arr[currentIdx] = '0';
      this.currentBoard = arr.join('');
      
      if (window.GameAudio) {
        window.GameAudio.playSwipe();
      }
      
      this.clearSolution();
      this.updateUI();
      this.saveState();
      
      // Check Win condition
      if (this.currentBoard === "0123456789abcdef") {
        setTimeout(() => {
          if (window.GameAudio) window.GameAudio.playWin();
          if (window.Confetti) window.Confetti.celebrate(3500);
          this.triggerWinEffect();
        }, 180);
      }
    }
  },

  triggerWinEffect() {
    // Flash all tiles
    for (let val = 1; val < 16; val++) {
      const el = document.getElementById(`fifteen-tile-${val}`);
      if (el) {
        el.classList.add("celebrating");
        setTimeout(() => el.classList.remove("celebrating"), 2000);
      }
    }
  },

  checkSolvability(board) {
    const blankIdx = board.indexOf('0');
    const blankRow = blankIdx >> 2;
    
    let inversions = 0;
    for (let i = 0; i < 16; i++) {
      if (board[i] === '0') continue;
      const valI = hexToVal(board[i]);
      for (let j = i + 1; j < 16; j++) {
        if (board[j] === '0') continue;
        const valJ = hexToVal(board[j]);
        if (valI > valJ) {
          inversions++;
        }
      }
    }
    return (blankRow + inversions) % 2 === 0;
  },

  generateRandomSolvableBoard() {
    const nums = Array.from({ length: 16 }, (_, i) => i);
    // Shuffle
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = nums[i];
      nums[i] = nums[j];
      nums[j] = temp;
    }
    
    let board = nums.map(valToHex).join('');
    
    // Ensure solvability
    if (!this.checkSolvability(board)) {
      // Swap two non-zero tiles
      let first = -1;
      let second = -1;
      for (let i = 0; i < 16; i++) {
        if (board[i] !== '0') {
          if (first === -1) first = i;
          else { second = i; break; }
        }
      }
      const arr = board.split('');
      const temp = arr[first];
      arr[first] = arr[second];
      arr[second] = temp;
      board = arr.join('');
    }
    return board;
  },

  updateUI() {
    const isSolvable = this.checkSolvability(this.currentBoard);
    const solveBtn = document.getElementById("fifteen-solve-btn");
    
    const banner = document.getElementById("fifteen-status-banner");
    if (isSolvable) {
      banner.textContent = "🎉 Все в порядке! Нажми «Решить»! ⚡";
      banner.className = "fifteen-banner solvable";
      solveBtn.disabled = this.mode === 'setup';
    } else {
      banner.textContent = "⚠️ Хм, такую комбинацию не получится собрать.";
      banner.className = "fifteen-banner unsolvable";
      solveBtn.disabled = true;
    }

    const isAnimals = window.portal ? window.portal.gameMode === 'animals' : true;

    // Draw each tile at its correct coordinates
    for (let val = 0; val < 16; val++) {
      const char = valToHex(val);
      const idx = this.currentBoard.indexOf(char);
      const row = idx >> 2;
      const col = idx & 3;

      const tile = document.getElementById(`fifteen-tile-${val}`);
      if (!tile) continue;

      // Update positions
      tile.style.setProperty("--row", row);
      tile.style.setProperty("--col", col);

      // Highlight target correct placement (slot match)
      if (val !== 0 && idx === val) {
        tile.classList.add("correct-position");
      } else {
        tile.classList.remove("correct-position");
      }

      // Handle visibility of 0/empty tile
      if (val === 0) {
        tile.style.display = this.mode === 'setup' ? 'flex' : 'none';
        tile.classList.toggle('setup-mode', this.mode === 'setup');
      } else {
        // Re-inject contents depending on Mode (Animals vs Numbers)
        const inner = tile.querySelector(".fifteen-tile-inner");
        inner.innerHTML = "";

        if (isAnimals) {
          const animal = FIFTEEN_ANIMALS[val];
          const icon = document.createElement("span");
          icon.className = "fifteen-icon";
          icon.textContent = animal.emoji;

          const label = document.createElement("span");
          label.className = "fifteen-label";
          label.textContent = animal.name;

          inner.appendChild(icon);
          inner.appendChild(label);
          tile.className = `fifteen-tile tile-v-${Math.pow(2, val)}`; // apply colors based on value mapping
        } else {
          const num = document.createElement("span");
          num.className = "fifteen-number";
          num.textContent = val;
          inner.appendChild(num);
          tile.className = `fifteen-tile number-mode tile-v-${Math.pow(2, val)}`;
        }
        
        // Toggle setup-mode AFTER className is assigned so it isn't overwritten
        tile.classList.toggle('setup-mode', this.mode === 'setup');
        
        if (idx === val) tile.classList.add("correct-position");
      }
    }
  },

  clearSolution() {
    this.solutionPath = [];
    this.currentStepIndex = 0;
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    document.getElementById("fifteen-play-btn").textContent = "▶️";
    this.enablePlaybackButtons(false);
    document.getElementById("fifteen-stat-steps").textContent = "-";
    document.getElementById("fifteen-stat-iterations").textContent = "-";
    this.renderStepsList();
  },

  enablePlaybackButtons(enable) {
    document.getElementById("fifteen-play-btn").disabled = !enable;
    document.getElementById("fifteen-prev-btn").disabled = !enable;
    document.getElementById("fifteen-next-btn").disabled = !enable;
    document.getElementById("fifteen-reset-btn").disabled = !enable;
  },

  renderStepsList() {
    const listEl = document.getElementById("fifteen-steps-list");
    listEl.innerHTML = "";

    if (this.solutionPath.length <= 1) {
      listEl.innerHTML = `<div class="fifteen-empty-steps">Решение не запущено.<br>Нажмите 'Решить', чтобы построить путь.</div>`;
      return;
    }

    for (let i = 1; i < this.solutionPath.length; i++) {
      const step = this.solutionPath[i];
      const li = document.createElement("li");
      li.className = "fifteen-step-item";
      if (i === this.currentStepIndex) li.classList.add("active");

      const move = step.move;
      let dirText = "";
      switch (move.dir) {
        case "UP": dirText = "вверх ↑"; break;
        case "DOWN": dirText = "вниз ↓"; break;
        case "LEFT": dirText = "влево ←"; break;
        case "RIGHT": dirText = "вправо →"; break;
      }

      // Kid-friendly description
      const name = window.portal && window.portal.gameMode === 'animals' 
        ? (FIFTEEN_ANIMALS[move.tile] ? FIFTEEN_ANIMALS[move.tile].name : move.tile)
        : `Плитка ${move.tile}`;
      const emoji = window.portal && window.portal.gameMode === 'animals' && FIFTEEN_ANIMALS[move.tile]
        ? FIFTEEN_ANIMALS[move.tile].emoji + " " : "";

      li.innerHTML = `
        <span class="fifteen-step-num">#${i}</span>
        <span class="fifteen-step-desc">${emoji}<strong>${name}</strong> ${dirText}</span>
      `;

      li.addEventListener("click", () => this.goToStep(i));
      listEl.appendChild(li);
    }

    const activeEl = listEl.querySelector(".active");
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  },

  goToStep(index) {
    if (index < 0 || index >= this.solutionPath.length) return;
    
    this.currentStepIndex = index;
    this.currentBoard = this.solutionPath[index].board;
    this.updateUI();
    this.saveState();

    // Update active list elements
    const items = document.querySelectorAll(".fifteen-step-item");
    items.forEach((item, i) => {
      item.classList.toggle("active", i + 1 === index);
      if (i + 1 === index) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });

    document.getElementById("fifteen-prev-btn").disabled = this.currentStepIndex === 0;
    document.getElementById("fifteen-next-btn").disabled = this.currentStepIndex === this.solutionPath.length - 1;
  },

  setSolveLoading(loading) {
    const solveBtn = document.getElementById("fifteen-solve-btn");
    const randomBtn = document.getElementById("fifteen-random-btn");
    const playBtn = document.getElementById("fifteen-mode-play");
    const setupBtn = document.getElementById("fifteen-mode-setup");

    if (loading) {
      solveBtn.disabled = true;
      solveBtn.innerHTML = `<span class="fifteen-spinner"></span> Поиск...`;
      randomBtn.disabled = true;
      playBtn.disabled = true;
      setupBtn.disabled = true;
    } else {
      solveBtn.disabled = false;
      solveBtn.innerHTML = "⚡ Найти решение";
      randomBtn.disabled = false;
      playBtn.disabled = false;
      setupBtn.disabled = false;
    }
  },

  togglePlay() {
    if (this.solutionPath.length <= 1) return;

    this.isPlaying = !this.isPlaying;
    const btn = document.getElementById("fifteen-play-btn");

    if (this.isPlaying) {
      btn.textContent = "⏸️";
      if (this.currentStepIndex === this.solutionPath.length - 1) {
        this.goToStep(0);
      }

      this.playbackInterval = setInterval(() => {
        if (this.currentStepIndex < this.solutionPath.length - 1) {
          this.goToStep(this.currentStepIndex + 1);
        } else {
          this.togglePlay(); // Stop playing when done
        }
      }, this.playbackSpeed);
    } else {
      btn.textContent = "▶️";
      if (this.playbackInterval) {
        clearInterval(this.playbackInterval);
        this.playbackInterval = null;
      }
    }
  },

  solvePuzzle() {
    if (this.worker) this.worker.terminate();

    this.clearSolution();
    this.setSolveLoading(true);
    
    const banner = document.getElementById("fifteen-status-banner");
    banner.textContent = "🤖 Робот думает...";

    this.startBoard = this.currentBoard;

    const isLocalFile = window.location.protocol === "file:";

    if (isLocalFile) {
      this.runMainThreadSolver();
    } else {
      try {
        this.worker = new Worker("solver.js");
        this.worker.postMessage({ board: this.startBoard });

        this.worker.onmessage = (e) => {
          this.handleSolverMessage(e.data);
        };
        this.worker.onerror = (err) => {
          console.warn("Worker error detected asynchronously, falling back to main thread:", err);
          this.worker.terminate();
          this.runMainThreadSolver();
        };
      } catch (e) {
        console.warn("Web Worker blocked synchronously. Falling back to main thread:", e);
        this.runMainThreadSolver();
      }
    }
  },

  runMainThreadSolver() {
    const banner = document.getElementById("fifteen-status-banner");
    if (typeof solve === "function") {
      banner.textContent = "🤖 Робот ищет путь...";
      
      setTimeout(() => {
        try {
          // Solve directly on main thread with a lower iteration limit for safety
          const result = solve(this.startBoard, 1.5, 20000);
          
          let finalResult = result;
          if (result.status === "timeout") {
            finalResult = solve(this.startBoard, 3.0, 30000);
          }
          
          if (finalResult.status === "solved") {
            this.handleSolverMessage({
              type: "success",
              path: finalResult.path,
              iterations: finalResult.iterations
            });
          } else {
            this.handleSolverMessage({
              type: "error",
              error: "Не удалось найти решение."
            });
          }
        } catch (err) {
          this.handleSolverMessage({
            type: "error",
            error: err.message
          });
        }
      }, 50);
    } else {
      banner.textContent = "Ошибка: Решатель не загружен.";
      banner.className = "fifteen-banner unsolvable";
      this.setSolveLoading(false);
    }
  },

  handleSolverMessage(data) {
    const banner = document.getElementById("fifteen-status-banner");
    if (data.type === "status") {
      banner.textContent = data.status;
    } else if (data.type === "progress") {
      banner.textContent = `🤖 Поиск пути... Проверено: ${data.iterations}`;
    } else if (data.type === "success") {
      this.setSolveLoading(false);
      this.solutionPath = data.path;
      this.currentStepIndex = 0;

      document.getElementById("fifteen-stat-steps").textContent = this.solutionPath.length - 1;
      document.getElementById("fifteen-stat-iterations").textContent = data.iterations;

      this.renderStepsList();
      this.enablePlaybackButtons(true);
      this.goToStep(0);
      banner.textContent = `🎉 Решение найдено! Сделай ${this.solutionPath.length - 1} шагов!`;
      banner.className = "fifteen-banner solvable";
      
      // Auto play solution
      this.togglePlay();
    } else if (data.type === "error") {
      this.setSolveLoading(false);
      banner.textContent = data.error;
      banner.className = "fifteen-banner unsolvable";
    }
  },

  handleDirectionInput(direction) {
    if (this.mode === 'setup') return;
    const blankIdx = this.currentBoard.indexOf('0');
    const rBlank = blankIdx >> 2;
    const cBlank = blankIdx & 3;
    
    let targetRow = rBlank;
    let targetCol = cBlank;
    
    switch (direction) {
      case 'up': targetRow = rBlank + 1; break; // slide tile below blank UP
      case 'down': targetRow = rBlank - 1; break; // slide tile above blank DOWN
      case 'left': targetCol = cBlank + 1; break; // slide tile right of blank LEFT
      case 'right': targetCol = cBlank - 1; break; // slide tile left of blank RIGHT
    }
    
    if (targetRow >= 0 && targetRow < 4 && targetCol >= 0 && targetCol < 4) {
      const targetIdx = (targetRow << 2) + targetCol;
      const tileChar = this.currentBoard[targetIdx];
      const tileVal = hexToVal(tileChar);
      this.slideTileByValue(tileVal);
    }
  },

  bindEvents() {
    // Play vs Setup modes
    const playBtn = document.getElementById("fifteen-mode-play");
    const setupBtn = document.getElementById("fifteen-mode-setup");

    playBtn.addEventListener("click", () => {
      if (this.mode === 'play') return;
      if (window.GameAudio) window.GameAudio.playClick();
      this.mode = 'play';
      playBtn.classList.add("active");
      setupBtn.classList.remove("active");
      this.clearSolution();
      this.updateUI();
    });

    setupBtn.addEventListener("click", () => {
      if (this.mode === 'setup') return;
      if (window.GameAudio) window.GameAudio.playClick();
      this.mode = 'setup';
      setupBtn.classList.add("active");
      playBtn.classList.remove("active");
      this.clearSolution();
      this.updateUI();
      this.updateSelectDropdowns();
    });

    // Randomize layout
    document.getElementById("fifteen-random-btn").addEventListener("click", () => {
      if (window.GameAudio) window.GameAudio.playClick();
      this.clearSolution();
      this.currentBoard = this.generateRandomSolvableBoard();
      this.updateUI();
      this.saveState();
    });

    // Solve button
    document.getElementById("fifteen-solve-btn").addEventListener("click", () => {
      if (window.GameAudio) window.GameAudio.playClick();
      this.solvePuzzle();
    });

    // Playback buttons
    document.getElementById("fifteen-play-btn").addEventListener("click", () => {
      if (window.GameAudio) window.GameAudio.playClick();
      this.togglePlay();
    });

    document.getElementById("fifteen-prev-btn").addEventListener("click", () => {
      if (window.GameAudio) window.GameAudio.playClick();
      if (this.isPlaying) this.togglePlay();
      this.goToStep(this.currentStepIndex - 1);
    });

    document.getElementById("fifteen-next-btn").addEventListener("click", () => {
      if (window.GameAudio) window.GameAudio.playClick();
      if (this.isPlaying) this.togglePlay();
      this.goToStep(this.currentStepIndex + 1);
    });

    document.getElementById("fifteen-reset-btn").addEventListener("click", () => {
      if (window.GameAudio) window.GameAudio.playClick();
      if (this.isPlaying) this.togglePlay();
      this.goToStep(0);
    });

    // Speed Slider listener
    const slider = document.getElementById("fifteen-speed-slider");
    const speedVal = document.getElementById("fifteen-speed-value");
    slider.addEventListener("input", (e) => {
      this.playbackSpeed = parseInt(e.target.value, 10);
      speedVal.textContent = (this.playbackSpeed / 1000).toFixed(1) + "с";

      if (this.isPlaying) {
        clearInterval(this.playbackInterval);
        this.playbackInterval = setInterval(() => {
          if (this.currentStepIndex < this.solutionPath.length - 1) {
            this.goToStep(this.currentStepIndex + 1);
          } else {
            this.togglePlay();
          }
        }, this.playbackSpeed);
      }
    });
  }
};

window.AppFifteen = AppFifteen;
