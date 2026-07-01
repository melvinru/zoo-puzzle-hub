const Portal = {
  activeGame: '2048',
  gameMode: 'animals', // unified: animals | numbers
  theme: 'candy',      // unified: candy | forest | ocean | neon
  sudokuSize: 4,       // default Sudoku size: 4
  bullsSize: 4,        // default Bulls and Cows size: 4
  crosswordSize: 5,    // default Crossword size: 5
  pyramidSize: 3,      // default Pyramid size: 3
  
  init() {
    this.loadSettings();
    
    // Bind navigation tabs
    const tab2048 = document.getElementById('tab-2048');
    const tab15ths = document.getElementById('tab-15ths');
    const tabSudoku = document.getElementById('tab-sudoku');
    const tabBulls = document.getElementById('tab-bulls');
    const tabCrossword = document.getElementById('tab-crossword');
    const tabPyramid = document.getElementById('tab-pyramid');
    
    if (tab2048) tab2048.addEventListener('click', () => this.switchGame('2048'));
    if (tab15ths) tab15ths.addEventListener('click', () => this.switchGame('15ths'));
    if (tabSudoku) tabSudoku.addEventListener('click', () => this.switchGame('sudoku'));
    if (tabBulls) tabBulls.addEventListener('click', () => this.switchGame('bulls'));
    if (tabCrossword) tabCrossword.addEventListener('click', () => this.switchGame('crossword'));
    if (tabPyramid) tabPyramid.addEventListener('click', () => this.switchGame('pyramid'));
    
    this.applyGameVisibility();
    this.bindInputs();
    this.updateMuteButtonsUI(window.GameAudio ? window.GameAudio.muted : false);
    this.syncActiveGameStates();
  },
  
  loadSettings() {
    try {
      this.activeGame = localStorage.getItem('zoo_portal_active_game') || '2048';
      this.gameMode = localStorage.getItem('zoo2048_game_mode') || 'animals';
      this.theme = localStorage.getItem('zoo2048_theme') || 'candy';
      this.sudokuSize = parseInt(localStorage.getItem('zoo_sudoku_board_size')) || 4;
      this.bullsSize = parseInt(localStorage.getItem('zoo_bulls_code_size')) || 4;
      this.crosswordSize = parseInt(localStorage.getItem('zoo_crossword_board_size')) || 5;
      this.pyramidSize = parseInt(localStorage.getItem('zoo_pyramid_board_size')) || 3;
    } catch (e) {
      console.warn("Could not load portal settings:", e);
    }
  },
  
  saveSettings() {
    try {
      localStorage.setItem('zoo_portal_active_game', this.activeGame);
      localStorage.setItem('zoo2048_game_mode', this.gameMode);
      localStorage.setItem('zoo2048_theme', this.theme);
      localStorage.setItem('zoo_sudoku_board_size', this.sudokuSize);
      localStorage.setItem('zoo_bulls_code_size', this.bullsSize);
      localStorage.setItem('zoo_crossword_board_size', this.crosswordSize);
      localStorage.setItem('zoo_pyramid_board_size', this.pyramidSize);
    } catch (e) {
      // BUG-04: log instead of silently swallowing
      console.warn('Could not save portal settings:', e);
    }
  },
  
  switchGame(gameName) {
    if (this.activeGame === gameName) return;
    
    this.activeGame = gameName;
    this.saveSettings();
    this.applyGameVisibility();
    
    if (window.GameAudio) {
      window.GameAudio.playClick();
    }
    
    this.syncActiveGameStates();
  },
  
  // DUP-06: data-driven config replaces 200-line if-else chain
  // Each game entry declares what to show/hide when it's active.
  _getGameConfig() {
    return {
      '2048': {
        containerId: 'game-2048-container',
        tabId: 'tab-2048',
        scoreId: 'portal-scores',
        restartBtnId: 'btn-restart-2048',
        gridBtnIds: ['btn-grid-3', 'btn-grid-4'],
        showTypeGroup: false,
        title: 'Zoo 2048 🐾',
        subtitle: (mode) => mode === 'animals' ? 'Собери Единорога! 🦄' : 'Веселая математика! 🔢',
        onActivate: null
      },
      '15ths': {
        containerId: 'game-15ths-container',
        tabId: 'tab-15ths',
        scoreId: null,
        restartBtnId: 'fifteen-random-btn',
        gridBtnIds: [],
        showGridGroup: false,
        showTypeGroup: true,
        title: 'Zoo Пятнашки 🧩',
        subtitle: () => 'Собери картинку по порядку!',
        onActivate: () => window.AppFifteen?.updateUI()
      },
      'sudoku': {
        containerId: 'game-sudoku-container',
        tabId: 'tab-sudoku',
        scoreId: 'sudoku-scores',
        restartBtnId: 'sudoku-restart-btn',
        gridBtnIds: ['btn-grid-s4', 'btn-grid-s6', 'btn-grid-s9'],
        showTypeGroup: false,
        title: 'Zoo Судоку 🔢',
        subtitle: (mode) => mode === 'animals' ? 'Собери всех зверят в сетке!' : 'Заполни сетку цифрами!',
        onActivate: () => window.AppSudoku?.updateUI()
      },
      'bulls': {
        containerId: 'game-bulls-container',
        tabId: 'tab-bulls',
        scoreId: 'bulls-scores',
        restartBtnId: 'bulls-restart-btn',
        gridBtnIds: ['btn-grid-b3', 'btn-grid-b4', 'btn-grid-b5'],
        showTypeGroup: false,
        title: 'Zoo Быки и Коровы 🐮',
        subtitle: (mode) => mode === 'animals' ? 'Разгадай секретный шифр из животных!' : 'Разгадай секретный шифр из цифр!',
        onActivate: () => window.AppBulls?.updateUI()
      },
      'crossword': {
        containerId: 'game-crossword-container',
        tabId: 'tab-crossword',
        scoreId: 'crossword-scores',
        restartBtnId: 'crossword-restart-btn',
        gridBtnIds: ['btn-grid-c5', 'btn-grid-c7'],
        showTypeGroup: false,
        title: 'Zoo Кроссворд 🧠',
        subtitle: (mode) => mode === 'animals' ? 'Реши математический кроссворд из животных!' : 'Реши математический кроссворд!',
        onActivate: () => window.AppCrossword?.updateUI()
      },
      'pyramid': {
        containerId: 'game-pyramid-container',
        tabId: 'tab-pyramid',
        scoreId: 'pyramid-scores',
        restartBtnId: 'pyramid-restart-btn',
        gridBtnIds: ['btn-grid-p3', 'btn-grid-p4', 'btn-grid-p5', 'btn-grid-p6'],
        showTypeGroup: false,
        title: 'Zoo Пирамида 🔺',
        subtitle: (mode) => mode === 'animals' ? 'Сложи плитки с животными, чтобы построить пирамиду!' : 'Сложи числа, чтобы построить пирамиду!',
        onActivate: () => window.AppPyramid?.updateUI()
      }
    };
  },

  applyGameVisibility() {
    const config = this._getGameConfig();
    const allScoreIds = ['portal-scores', 'sudoku-scores', 'bulls-scores', 'crossword-scores', 'pyramid-scores'];
    const allGridBtnIds = [
      'btn-grid-3', 'btn-grid-4',
      'btn-grid-s4', 'btn-grid-s6', 'btn-grid-s9',
      'btn-grid-b3', 'btn-grid-b4', 'btn-grid-b5',
      'btn-grid-c5', 'btn-grid-c7',
      'btn-grid-p3', 'btn-grid-p4', 'btn-grid-p5', 'btn-grid-p6'
    ];
    const allRestartIds = [
      'btn-restart-2048', 'fifteen-random-btn', 'sudoku-restart-btn',
      'bulls-restart-btn', 'crossword-restart-btn', 'pyramid-restart-btn'
    ];
    const allContainerIds = Object.values(config).map(c => c.containerId);
    const allTabIds = Object.values(config).map(c => c.tabId);

    // Hide everything first
    const hide = (id) => document.getElementById(id)?.classList.add('hidden');
    const show = (id) => document.getElementById(id)?.classList.remove('hidden');
    const toggleActive = (id, active) => document.getElementById(id)?.classList.toggle('active', active);

    allContainerIds.forEach(hide);
    allTabIds.forEach(id => toggleActive(id, false));
    allGridBtnIds.forEach(hide);
    allRestartIds.forEach(hide);
    allScoreIds.forEach(hide);

    // Show active game elements
    const active = config[this.activeGame];
    if (!active) return;

    show(active.containerId);
    toggleActive(active.tabId, true);
    active.gridBtnIds.forEach(show);
    if (active.restartBtnId) show(active.restartBtnId);
    if (active.scoreId) show(active.scoreId);

    // Settings bar: grid group & type group
    const settingsGridGroup = document.getElementById('settings-grid-group');
    const settingsTypeGroup = document.getElementById('settings-type-group');
    if (settingsGridGroup) {
      settingsGridGroup.classList.toggle('hidden', active.showGridGroup === false);
    }
    if (settingsTypeGroup) {
      settingsTypeGroup.classList.toggle('hidden', !active.showTypeGroup);
    }

    // Header text
    const portalTitle = document.getElementById('portal-title');
    const portalSubtitle = document.getElementById('portal-subtitle');
    if (portalTitle) portalTitle.textContent = active.title;
    if (portalSubtitle) portalSubtitle.textContent = active.subtitle(this.gameMode);

    // Activate game module
    if (active.onActivate) active.onActivate();
  },
  
  updatePortalModeButtonsUI() {
    const btnAnimals = document.getElementById('btn-mode-animals');
    const btnNumbers = document.getElementById('btn-mode-numbers');
    if (btnAnimals && btnNumbers) {
      btnAnimals.classList.toggle('active', this.gameMode === 'animals');
      btnNumbers.classList.toggle('active', this.gameMode === 'numbers');
    }
  },
  
  syncActiveGameStates() {
    // Propagate unified mode and themes
    if (window.app) {
      window.app.gameMode = this.gameMode;
      window.app.theme = this.theme;
      window.app.updateToggleButtonsUI();
    }
    if (window.AppFifteen) {
      window.AppFifteen.updateUI();
    }
    if (window.AppSudoku) {
      window.AppSudoku.setBoardSize(this.sudokuSize);
    }
    if (window.AppBulls) {
      window.AppBulls.setCodeSize(this.bullsSize);
    }
    if (window.AppCrossword) {
      window.AppCrossword.setBoardSize(this.crosswordSize);
    }
    if (window.AppPyramid) {
      window.AppPyramid.setBoardSize(this.pyramidSize);
    }

    // Sync Sudoku grid switcher buttons
    const btnS4 = document.getElementById('btn-grid-s4');
    const btnS6 = document.getElementById('btn-grid-s6');
    const btnS9 = document.getElementById('btn-grid-s9');
    if (btnS4) btnS4.classList.toggle('active', this.sudokuSize === 4);
    if (btnS6) btnS6.classList.toggle('active', this.sudokuSize === 6);
    if (btnS9) btnS9.classList.toggle('active', this.sudokuSize === 9);

    // Sync Bulls grid switcher buttons
    const btnB3 = document.getElementById('btn-grid-b3');
    const btnB4 = document.getElementById('btn-grid-b4');
    const btnB5 = document.getElementById('btn-grid-b5');
    if (btnB3) btnB3.classList.toggle('active', this.bullsSize === 3);
    if (btnB4) btnB4.classList.toggle('active', this.bullsSize === 4);
    if (btnB5) btnB5.classList.toggle('active', this.bullsSize === 5);

    // Sync Crossword grid switcher buttons
    const btnC5 = document.getElementById('btn-grid-c5');
    const btnC7 = document.getElementById('btn-grid-c7');
    if (btnC5) btnC5.classList.toggle('active', this.crosswordSize === 5);
    if (btnC7) btnC7.classList.toggle('active', this.crosswordSize === 7);
 
    // Sync Pyramid grid switcher buttons
    const btnP3 = document.getElementById('btn-grid-p3');
    const btnP4 = document.getElementById('btn-grid-p4');
    const btnP5 = document.getElementById('btn-grid-p5');
    const btnP6 = document.getElementById('btn-grid-p6');
    if (btnP3) btnP3.classList.toggle('active', this.pyramidSize === 3);
    if (btnP4) btnP4.classList.toggle('active', this.pyramidSize === 4);
    if (btnP5) btnP5.classList.toggle('active', this.pyramidSize === 5);
    if (btnP6) btnP6.classList.toggle('active', this.pyramidSize === 6);
 
    this.updatePortalModeButtonsUI();
    document.body.className = `theme-${this.theme}`;
  },
  
  setGameMode(mode) {
    this.gameMode = mode;
    this.saveSettings();
    
    if (window.app) {
      window.app.setGameMode(mode);
    }
    if (window.AppFifteen) {
      window.AppFifteen.updateUI();
    }
    if (window.AppSudoku) {
      window.AppSudoku.updateUI();
    }
    if (window.AppBulls) {
      window.AppBulls.updateUI();
    }
    if (window.AppCrossword) {
      window.AppCrossword.updateUI();
    }
    if (window.AppPyramid) {
      window.AppPyramid.updateUI();
    }
    this.updatePortalModeButtonsUI();
    this.applyGameVisibility();
  },
  
  toggleMute() {
    if (window.GameAudio) {
      const isMuted = window.GameAudio.toggleMute();
      this.updateMuteButtonsUI(isMuted);
      if (!isMuted) {
        window.GameAudio.playClick();
      }
    }
  },
  
  updateMuteButtonsUI(isMuted) {
    const icon = isMuted ? '🔇' : '🔊';
    const muteIcons = document.querySelectorAll('.mute-icon');
    muteIcons.forEach(el => el.textContent = icon);
  },

  setTheme(theme) {
    this.theme = theme;
    this.saveSettings();
    
    document.body.className = `theme-${theme}`;
    
    if (window.app) {
      window.app.theme = theme;
      window.app.updateThemeSelectorUI();
    }
    if (window.AppFifteen) {
      window.AppFifteen.updateUI();
    }
    if (window.AppSudoku) {
      window.AppSudoku.updateUI();
    }
    if (window.AppBulls) {
      window.AppBulls.updateUI();
    }
    if (window.AppCrossword) {
      window.AppCrossword.updateUI();
    }
  },
  
  setSudokuSize(size) {
    if (this.sudokuSize === size) return;
    if (window.GameAudio) window.GameAudio.playClick();
    this.sudokuSize = size;
    this.saveSettings();
    
    if (window.AppSudoku) {
      window.AppSudoku.setBoardSize(size);
    }
    this.syncActiveGameStates();
  },
  
  setBullsSize(size) {
    if (this.bullsSize === size) return;
    if (window.GameAudio) window.GameAudio.playClick();
    this.bullsSize = size;
    this.saveSettings();
    
    if (window.AppBulls) {
      window.AppBulls.setCodeSize(size);
    }
    this.syncActiveGameStates();
  },
  
  setCrosswordSize(size) {
    if (this.crosswordSize === size) return;
    if (window.GameAudio) window.GameAudio.playClick();
    this.crosswordSize = size;
    this.saveSettings();
    
    if (window.AppCrossword) {
      window.AppCrossword.setBoardSize(size);
    }
    this.syncActiveGameStates();
  },
  
  setPyramidSize(size) {
    if (this.pyramidSize === size) return;
    if (window.GameAudio) window.GameAudio.playClick();
    this.pyramidSize = size;
    this.saveSettings();
    
    if (window.AppPyramid) {
      window.AppPyramid.setBoardSize(size);
    }
    this.syncActiveGameStates();
  },
  
  bindInputs() {
    // Redirect inputs for 15ths
    window.addEventListener('keydown', (e) => {
      if (this.activeGame !== '15ths') return;
      
      const keyMap = {
        'ArrowUp': 'up', 'KeyW': 'up',
        'ArrowDown': 'down', 'KeyS': 'down',
        'ArrowLeft': 'left', 'KeyA': 'left',
        'ArrowRight': 'right', 'KeyD': 'right'
      };
      
      const direction = keyMap[e.code];
      if (direction && window.AppFifteen) {
        e.preventDefault();
        window.AppFifteen.handleDirectionInput(direction);
      }
    }, { passive: false });
    
    // Touch swipes for 15ths board wrapper
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Wait for DOM load to bind touch
    window.addEventListener('load', () => {
      const fifteenBoard = document.getElementById('fifteen-board-wrapper');
      if (fifteenBoard) {
        fifteenBoard.addEventListener('touchstart', (e) => {
          if (this.activeGame !== '15ths') return;
          if (e.touches.length > 1) return;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        fifteenBoard.addEventListener('touchend', (e) => {
          if (this.activeGame !== '15ths') return;
          if (e.changedTouches.length === 0) return;
          
          const deltaX = e.changedTouches[0].clientX - touchStartX;
          const deltaY = e.changedTouches[0].clientY - touchStartY;
          const threshold = 35;
          
          if (window.AppFifteen) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              if (Math.abs(deltaX) > threshold) {
                window.AppFifteen.handleDirectionInput(deltaX > 0 ? 'right' : 'left');
              }
            } else {
              if (Math.abs(deltaY) > threshold) {
                window.AppFifteen.handleDirectionInput(deltaY > 0 ? 'down' : 'up');
              }
            }
          }
        }, { passive: true });
        
        fifteenBoard.addEventListener('touchmove', (e) => {
          if (this.activeGame !== '15ths') return;
          if (e.cancelable) {
            e.preventDefault();
          }
        }, { passive: false });
      }
    });
  }
};

window.portal = Portal;
window.addEventListener('DOMContentLoaded', () => {
  if (window.AppFifteen) {
    window.AppFifteen.init();
  }
  if (window.AppSudoku) {
    window.AppSudoku.init();
  }
  if (window.AppBulls) {
    window.AppBulls.init();
  }
  if (window.AppCrossword) {
    window.AppCrossword.init();
  }
  if (window.AppPyramid) {
    window.AppPyramid.init();
  }
  Portal.init();
});
