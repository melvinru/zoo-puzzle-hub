// --- Kids Bulls and Cows Game Engine ---
const BULLS_TILES = {
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

class AppBullsClass {
  constructor() {
    this.codeSize = 4; // default: 4 symbols (Normal)
    this.secretCode = []; // Array of unique numbers 1-9
    this.currentGuess = []; // Array of currently inputted unique numbers
    this.guessHistory = []; // Array of { guess: Array, bulls: Number, cows: Number }
    this.wins = { 3: 0, 4: 0, 5: 0 };
    this.won = false;
  }

  init() {
    this.bindEvents();
    this.loadWins();
    this.updateWinsUI();

    // Load or generate board
    if (!this.loadState()) {
      this.startNewGame();
    } else {
      this.updateUI();
    }
  }

  // BUG-02: keydown handler stored as class method so it can be properly removed
  _handleKeyDown(e) {
    if (window.portal && window.portal.activeGame !== 'bulls') return;
    if (this.won) return;

    if (e.key >= '1' && e.key <= '9') {
      this.addSymbolToGuess(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      this.removeLastSymbol();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.submitGuess();
    }
  }

  setCodeSize(size) {
    if (this.codeSize === size) return;
    if (window.GameAudio) window.GameAudio.playClick();
    this.codeSize = size;
    
    // Save to settings
    try {
      localStorage.setItem('zoo_bulls_code_size', this.codeSize);
    } catch(e) {}

    if (window.portal) {
      window.portal.syncActiveGameStates();
    }

    if (!this.loadState()) {
      this.startNewGame();
    } else {
      this.updateUI();
    }
  }

  startNewGame() {
    this.won = false;
    this.secretCode = this.generateSecretCode();
    this.currentGuess = [];
    this.guessHistory = [];
    this.saveState();
    this.updateUI();
  }

  generateSecretCode() {
    const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // DUP-04: use shared shuffle utility
    return shuffle(pool).slice(0, this.codeSize);
  }

  addSymbolToGuess(val) {
    if (this.won) return;
    if (this.currentGuess.length >= this.codeSize) return;
    if (this.currentGuess.includes(val)) return; // must be unique

    this.currentGuess.push(val);
    if (window.GameAudio) window.GameAudio.playSwipe();
    this.saveState();
    this.renderGuessSlots();
    this.renderKeypad(); // Update keypad disabled states
    this.updateStatusBanner();
  }

  removeLastSymbol() {
    if (this.won) return;
    if (this.currentGuess.length === 0) return;

    this.currentGuess.pop();
    if (window.GameAudio) window.GameAudio.playClick();
    this.saveState();
    this.renderGuessSlots();
    this.renderKeypad(); // Update keypad disabled states
    this.updateStatusBanner();
  }

  clearGuess() {
    if (this.won) return;
    if (this.currentGuess.length === 0) return;

    this.currentGuess = [];
    if (window.GameAudio) window.GameAudio.playClick();
    this.saveState();
    this.renderGuessSlots();
    this.renderKeypad();
    this.updateStatusBanner();
  }

  submitGuess() {
    if (this.won) return;
    if (this.currentGuess.length !== this.codeSize) {
      const banner = document.getElementById('bulls-status-banner');
      if (banner) {
        banner.className = 'fifteen-banner unsolvable';
        banner.textContent = this.getWarningText();
      }
      return;
    }

    // Calculate Bulls and Cows
    let bulls = 0;
    let cows = 0;
    for (let i = 0; i < this.codeSize; i++) {
      const val = this.currentGuess[i];
      if (val === this.secretCode[i]) {
        bulls++;
      } else if (this.secretCode.includes(val)) {
        cows++;
      }
    }

    // Add to history
    this.guessHistory.push({
      guess: [...this.currentGuess],
      bulls: bulls,
      cows: cows
    });

    // Clear current input
    this.currentGuess = [];
    
    this.saveState();
    this.updateUI();

    // Check Victory
    if (bulls === this.codeSize) {
      this.won = true;
      this.wins[this.codeSize] = (this.wins[this.codeSize] || 0) + 1;
      this.saveWins();
      this.updateUI();

      setTimeout(() => {
        if (window.GameAudio) window.GameAudio.playWin();
        if (window.Confetti) window.Confetti.celebrate(4500);

        // DUP (ARCH-04): use shared showWinModalWith to avoid mutating 2048 modal DOM directly
        const mode = getGameMode();
        const attemptsText = `<strong>${this.guessHistory.length}</strong>`;
        const bodyText = mode === 'animals'
          ? `Потрясающий спецагент! Ты отгадал всех секретных зверят за ${attemptsText} попыток!`
          : `Потрясающий спецагент! Ты отгадал все секретные цифры за ${attemptsText} попыток!`;

        showWinModalWith({
          title: 'Ты разгадал шифр! 🎉🕵️‍♂️',
          text: bodyText,
          continueText: 'Посмотреть попытки 👀',
          onContinue: null,
          onRestart: () => this.startNewGame()
        });
      }, 350);
    }
  }

  saveState() {
    try {
      localStorage.setItem('zoo_bulls_code_size', this.codeSize);
      localStorage.setItem(`zoo_bulls_secret_code_${this.codeSize}`, JSON.stringify(this.secretCode));
      localStorage.setItem(`zoo_bulls_current_guess_${this.codeSize}`, JSON.stringify(this.currentGuess));
      localStorage.setItem(`zoo_bulls_history_${this.codeSize}`, JSON.stringify(this.guessHistory));
      localStorage.setItem(`zoo_bulls_won_${this.codeSize}`, JSON.stringify(this.won));
    } catch (e) {
      console.warn("Could not save Bulls and Cows state:", e);
    }
  }

  loadState() {
    try {
      const savedSize = localStorage.getItem('zoo_bulls_code_size');
      if (savedSize) {
        this.codeSize = parseInt(savedSize);
      }
      const savedSecret = localStorage.getItem(`zoo_bulls_secret_code_${this.codeSize}`);
      const savedGuess = localStorage.getItem(`zoo_bulls_current_guess_${this.codeSize}`);
      const savedHistory = localStorage.getItem(`zoo_bulls_history_${this.codeSize}`);
      const savedWon = localStorage.getItem(`zoo_bulls_won_${this.codeSize}`);
      if (savedSecret && savedGuess && savedHistory) {
        const parsedSecret = JSON.parse(savedSecret);
        if (parsedSecret && parsedSecret.length === this.codeSize) {
          this.secretCode = parsedSecret;
          this.currentGuess = JSON.parse(savedGuess);
          this.guessHistory = JSON.parse(savedHistory);
          this.won = savedWon ? JSON.parse(savedWon) : false;
          return true;
        }
      }

      // Fallback to legacy single keys if size matches
      const legacySize = localStorage.getItem('zoo_bulls_code_size');
      if (legacySize && parseInt(legacySize) === this.codeSize) {
        const legacySecret = localStorage.getItem('zoo_bulls_secret_code');
        const legacyGuess = localStorage.getItem('zoo_bulls_current_guess');
        const legacyHistory = localStorage.getItem('zoo_bulls_history');
        const legacyWon = localStorage.getItem('zoo_bulls_won');
        if (legacySecret && legacyGuess && legacyHistory) {
          const parsedSecret = JSON.parse(legacySecret);
          if (parsedSecret && parsedSecret.length === this.codeSize) {
            this.secretCode = parsedSecret;
            this.currentGuess = JSON.parse(legacyGuess);
            this.guessHistory = JSON.parse(legacyHistory);
            this.won = legacyWon ? JSON.parse(legacyWon) : false;
            return true;
          }
        }
      }
    } catch (e) {
      console.warn("Could not load Bulls and Cows state:", e);
    }
    return false;
  }

  loadWins() {
    // DUP-03: use shared createWinsStorage
    const storage = createWinsStorage('zoo_bulls_wins', { 3: 0, 4: 0, 5: 0 });
    this.wins = storage.load();
  }

  saveWins() {
    // DUP-03: use shared createWinsStorage
    const storage = createWinsStorage('zoo_bulls_wins', { 3: 0, 4: 0, 5: 0 });
    storage.save(this.wins);
  }

  updateWinsUI() {
    const labelEl = document.getElementById('bulls-wins-label');
    const valueEl = document.getElementById('bulls-wins-value');
    if (labelEl) {
      labelEl.textContent = `ПОБЕД ${this.codeSize} симв.`;
    }
    if (valueEl) {
      valueEl.textContent = this.wins[this.codeSize] || 0;
    }
  }

  renderGuessSlots() {
    const container = document.getElementById('bulls-guess-slots');
    if (!container) return;
    container.innerHTML = '';

    // DUP-05: use shared getGameMode
    const mode = getGameMode();

    for (let i = 0; i < this.codeSize; i++) {
      const slot = document.createElement('div');
      slot.className = 'bulls-guess-slot';

      const val = this.currentGuess[i];
      if (val !== undefined) {
        slot.classList.add('filled');
        // DUP-01: use shared createTileInner
        slot.appendChild(createTileInner(val, BULLS_TILES, mode));

        // Click to remove this item
        slot.addEventListener('click', () => {
          this.currentGuess.splice(i, 1);
          if (window.GameAudio) window.GameAudio.playClick();
          this.saveState();
          this.renderGuessSlots();
          this.renderKeypad();
        });
      } else {
        slot.textContent = '?';
      }
      container.appendChild(slot);
    }
  }

  renderHistory() {
    const historyList = document.getElementById('bulls-history-list');
    if (!historyList) return;
    historyList.innerHTML = '';

    if (this.guessHistory.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'fifteen-empty-steps';
      emptyMsg.innerHTML = 'История попыток пуста.<br>Введите шифр и нажмите "Попробовать".';
      historyList.appendChild(emptyMsg);
      return;
    }

    const mode = window.portal ? window.portal.gameMode : 'animals';

    this.guessHistory.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'bulls-history-row';

      // Attempt index
      const idxSpan = document.createElement('span');
      idxSpan.className = 'bulls-history-index';
      idxSpan.textContent = `#${index + 1}`;
      row.appendChild(idxSpan);

      // Guess tiles list
      const tilesContainer = document.createElement('div');
      tilesContainer.className = 'bulls-history-tiles';

      item.guess.forEach(val => {
        const tile = document.createElement('div');
        tile.className = 'bulls-history-tile';

        if (mode === 'animals') {
          const data = BULLS_TILES[val];
          tile.textContent = data.emoji;
          tile.title = data.name;
        } else {
          tile.textContent = val;
        }
        tilesContainer.appendChild(tile);
      });
      row.appendChild(tilesContainer);

      // Clues block
      const cluesContainer = document.createElement('div');
      cluesContainer.className = 'bulls-history-clues';

      const bullsSpan = document.createElement('span');
      bullsSpan.className = 'bulls-clue-bulls';
      bullsSpan.innerHTML = `🐂 <strong>${item.bulls}</strong>`;
      
      const cowsSpan = document.createElement('span');
      cowsSpan.className = 'bulls-clue-cows';
      cowsSpan.innerHTML = `🐄 <strong>${item.cows}</strong>`;

      cluesContainer.appendChild(bullsSpan);
      cluesContainer.appendChild(cowsSpan);
      row.appendChild(cluesContainer);

      historyList.appendChild(row);
    });

    // Auto scroll scroll-box to bottom
    const scrollContainer = document.getElementById('bulls-history-scroll');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  renderKeypad() {
    const keypad = document.getElementById('bulls-keypad');
    if (!keypad) return;

    // DUP-05: use shared getGameMode
    const mode = getGameMode();
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // DUP-02: use shared renderKeypadButtons with disabled state
    renderKeypadButtons(keypad, BULLS_TILES, values, mode, (val) => {
      this.addSymbolToGuess(val);
    }, '', (val) => this.currentGuess.includes(val));
  }

  updateUI() {
    this.renderGuessSlots();
    this.renderHistory();
    this.renderKeypad();
    this.updateWinsUI();
    this.updateStatusBanner();
  }

  getStatusStartText() {
    const mode = window.portal ? window.portal.gameMode : 'animals';
    if (mode === 'animals') {
      if (this.codeSize === 3) return 'Отгадай 3 зверя! 🕵️‍♂️';
      if (this.codeSize === 4) return 'Отгадай 4 зверя! 🕵️‍♂️';
      return 'Отгадай 5 зверей! 🕵️‍♂️';
    } else {
      if (this.codeSize === 3) return 'Отгадай 3 цифры! 🔢';
      if (this.codeSize === 4) return 'Отгадай 4 цифры! 🔢';
      return 'Отгадай 5 цифр! 🔢';
    }
  }

  getWarningText() {
    const mode = window.portal ? window.portal.gameMode : 'animals';
    if (mode === 'animals') {
      if (this.codeSize === 3) return 'Нужно выбрать 3 зверя! ⚠️';
      if (this.codeSize === 4) return 'Нужно выбрать 4 зверя! ⚠️';
      return 'Нужно выбрать 5 зверей! ⚠️';
    } else {
      if (this.codeSize === 3) return 'Нужно выбрать 3 цифры! ⚠️';
      if (this.codeSize === 4) return 'Нужно выбрать 4 цифры! ⚠️';
      return 'Нужно выбрать 5 цифр! ⚠️';
    }
  }

  updateStatusBanner() {
    const banner = document.getElementById('bulls-status-banner');
    if (!banner) return;

    if (this.won) {
      banner.className = 'fifteen-banner solvable';
      banner.textContent = `Победа за ${this.guessHistory.length} попыток! 🎉`;
      return;
    }

    if (this.guessHistory.length === 0) {
      banner.className = 'fifteen-banner solvable';
      banner.textContent = this.getStatusStartText();
    } else {
      const last = this.guessHistory[this.guessHistory.length - 1];
      banner.className = 'fifteen-banner solvable';
      banner.innerHTML = `Попытка ${this.guessHistory.length}: 🐂 <strong>${last.bulls}</strong> | 🐄 <strong>${last.cows}</strong>`;
    }
  }

  bindEvents() {
    const infoBtn = document.getElementById('bulls-info-btn');
    const rulesDrawer = document.getElementById('bulls-rules-drawer');
    if (infoBtn && rulesDrawer) {
      const newInfo = infoBtn.cloneNode(true);
      infoBtn.parentNode.replaceChild(newInfo, infoBtn);
      newInfo.addEventListener('click', () => {
        if (window.GameAudio) window.GameAudio.playClick();
        rulesDrawer.classList.toggle('hidden');
        newInfo.classList.toggle('active');
      });
    }

    const restartBtn = document.getElementById('bulls-restart-btn');
    if (restartBtn) {
      const newRestart = restartBtn.cloneNode(true);
      restartBtn.parentNode.replaceChild(newRestart, restartBtn);
      newRestart.addEventListener('click', () => this.startNewGame());
    }

    const submitBtn = document.getElementById('bulls-submit-btn');
    if (submitBtn) {
      const newSubmit = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
      newSubmit.addEventListener('click', () => this.submitGuess());
    }

    const backspaceBtn = document.getElementById('bulls-backspace-btn');
    if (backspaceBtn) {
      const newBackspace = backspaceBtn.cloneNode(true);
      backspaceBtn.parentNode.replaceChild(newBackspace, backspaceBtn);
      newBackspace.addEventListener('click', () => this.removeLastSymbol());
    }

    // BUG-02: bind _handleKeyDown as a class method so removeEventListener works correctly
    // Wrap with arrow to preserve 'this' context
    this._boundKeyDown = (e) => this._handleKeyDown(e);
    window.removeEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keydown', this._boundKeyDown);
  }
}

window.AppBulls = new AppBullsClass();
