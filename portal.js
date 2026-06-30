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
    } catch (e) {}
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
  
  applyGameVisibility() {
    const container2048 = document.getElementById('game-2048-container');
    const container15ths = document.getElementById('game-15ths-container');
    const containerSudoku = document.getElementById('game-sudoku-container');
    const containerBulls = document.getElementById('game-bulls-container');
    const containerCrossword = document.getElementById('game-crossword-container');
    const containerPyramid = document.getElementById('game-pyramid-container');
    const tab2048 = document.getElementById('tab-2048');
    const tab15ths = document.getElementById('tab-15ths');
    const tabSudoku = document.getElementById('tab-sudoku');
    const tabBulls = document.getElementById('tab-bulls');
    const tabCrossword = document.getElementById('tab-crossword');
    const tabPyramid = document.getElementById('tab-pyramid');
    
    // Shared header elements references
    const portalTitle = document.getElementById('portal-title');
    const portalSubtitle = document.getElementById('portal-subtitle');
    const portalScores = document.getElementById('portal-scores');
    const sudokuScores = document.getElementById('sudoku-scores');
    const bullsScores = document.getElementById('bulls-scores');
    const crosswordScores = document.getElementById('crossword-scores');
    const pyramidScores = document.getElementById('pyramid-scores');
    const settingsGridGroup = document.getElementById('settings-grid-group');
    const settingsTypeGroup = document.getElementById('settings-type-group');
    
    const btnRestart2048 = document.getElementById('btn-restart-2048');
    const btnRandom15 = document.getElementById('fifteen-random-btn');
    const btnRestartSudoku = document.getElementById('sudoku-restart-btn');
    const btnRestartBulls = document.getElementById('bulls-restart-btn');
    const btnRestartCrossword = document.getElementById('crossword-restart-btn');
    const btnRestartPyramid = document.getElementById('pyramid-restart-btn');
    
    const btnGrid3 = document.getElementById('btn-grid-3');
    const btnGrid4 = document.getElementById('btn-grid-4');
    const btnGridS4 = document.getElementById('btn-grid-s4');
    const btnGridS6 = document.getElementById('btn-grid-s6');
    const btnGridS9 = document.getElementById('btn-grid-s9');
    const btnGridB3 = document.getElementById('btn-grid-b3');
    const btnGridB4 = document.getElementById('btn-grid-b4');
    const btnGridB5 = document.getElementById('btn-grid-b5');
    const btnGridC5 = document.getElementById('btn-grid-c5');
    const btnGridC7 = document.getElementById('btn-grid-c7');
    const btnGridP3 = document.getElementById('btn-grid-p3');
    const btnGridP4 = document.getElementById('btn-grid-p4');
    const btnGridP5 = document.getElementById('btn-grid-p5');
    const btnGridP6 = document.getElementById('btn-grid-p6');

    // Hide all containers
    if (container2048) container2048.classList.add('hidden');
    if (container15ths) container15ths.classList.add('hidden');
    if (containerSudoku) containerSudoku.classList.add('hidden');
    if (containerBulls) containerBulls.classList.add('hidden');
    if (containerCrossword) containerCrossword.classList.add('hidden');
    if (containerPyramid) containerPyramid.classList.add('hidden');
    
    // Reset tabs
    if (tab2048) tab2048.classList.remove('active');
    if (tab15ths) tab15ths.classList.remove('active');
    if (tabSudoku) tabSudoku.classList.remove('active');
    if (tabBulls) tabBulls.classList.remove('active');
    if (tabCrossword) tabCrossword.classList.remove('active');
    if (tabPyramid) tabPyramid.classList.remove('active');

    // Default: hide all grid selector buttons
    if (btnGrid3) btnGrid3.classList.add('hidden');
    if (btnGrid4) btnGrid4.classList.add('hidden');
    if (btnGridS4) btnGridS4.classList.add('hidden');
    if (btnGridS6) btnGridS6.classList.add('hidden');
    if (btnGridS9) btnGridS9.classList.add('hidden');
    if (btnGridB3) btnGridB3.classList.add('hidden');
    if (btnGridB4) btnGridB4.classList.add('hidden');
    if (btnGridB5) btnGridB5.classList.add('hidden');
    if (btnGridC5) btnGridC5.classList.add('hidden');
    if (btnGridC7) btnGridC7.classList.add('hidden');
    if (btnGridP3) btnGridP3.classList.add('hidden');
    if (btnGridP4) btnGridP4.classList.add('hidden');
    if (btnGridP5) btnGridP5.classList.add('hidden');
    if (btnGridP6) btnGridP6.classList.add('hidden');

    // Default: hide all restart/action buttons
    if (btnRestart2048) btnRestart2048.classList.add('hidden');
    if (btnRandom15) btnRandom15.classList.add('hidden');
    if (btnRestartSudoku) btnRestartSudoku.classList.add('hidden');
    if (btnRestartBulls) btnRestartBulls.classList.add('hidden');
    if (btnRestartCrossword) btnRestartCrossword.classList.add('hidden');
    if (btnRestartPyramid) btnRestartPyramid.classList.add('hidden');

    // Default: hide all scoreboard containers
    if (portalScores) portalScores.classList.add('hidden');
    if (sudokuScores) sudokuScores.classList.add('hidden');
    if (bullsScores) bullsScores.classList.add('hidden');
    if (crosswordScores) crosswordScores.classList.add('hidden');
    if (pyramidScores) pyramidScores.classList.add('hidden');

    if (this.activeGame === '2048') {
      if (container2048) container2048.classList.remove('hidden');
      if (tab2048) tab2048.classList.add('active');
      
      // Update header states for 2048
      if (portalTitle) portalTitle.textContent = 'Zoo 2048 🐾';
      if (portalSubtitle) {
        if (this.gameMode === 'animals') {
          portalSubtitle.textContent = 'Собери Единорога! 🦄';
        } else {
          portalSubtitle.textContent = 'Веселая математика! 🔢';
        }
      }
      if (portalScores) portalScores.classList.remove('hidden');
      if (settingsGridGroup) settingsGridGroup.classList.remove('hidden');
      if (settingsTypeGroup) settingsTypeGroup.classList.add('hidden');
      if (btnRestart2048) btnRestart2048.classList.remove('hidden');

      // Show 2048 grid size buttons
      if (btnGrid3) btnGrid3.classList.remove('hidden');
      if (btnGrid4) btnGrid4.classList.remove('hidden');
    } else if (this.activeGame === '15ths') {
      if (container15ths) container15ths.classList.remove('hidden');
      if (tab15ths) tab15ths.classList.add('active');
      
      // Update header states for 15ths
      if (portalTitle) portalTitle.textContent = 'Zoo Пятнашки 🧩';
      if (portalSubtitle) portalSubtitle.textContent = 'Собери картинку по порядку!';
      if (settingsGridGroup) settingsGridGroup.classList.add('hidden');
      if (settingsTypeGroup) settingsTypeGroup.classList.remove('hidden');
      if (btnRandom15) btnRandom15.classList.remove('hidden');
      
      if (window.AppFifteen) {
        window.AppFifteen.updateUI();
      }
    } else if (this.activeGame === 'sudoku') {
      if (containerSudoku) containerSudoku.classList.remove('hidden');
      if (tabSudoku) tabSudoku.classList.add('active');

      // Update header states for Sudoku
      if (portalTitle) portalTitle.textContent = 'Zoo Судоку 🔢';
      if (portalSubtitle) {
        if (this.gameMode === 'animals') {
          portalSubtitle.textContent = 'Собери всех зверят в сетке!';
        } else {
          portalSubtitle.textContent = 'Заполни сетку цифрами!';
        }
      }
      if (sudokuScores) sudokuScores.classList.remove('hidden');
      if (settingsGridGroup) settingsGridGroup.classList.remove('hidden');
      if (settingsTypeGroup) settingsTypeGroup.classList.add('hidden');
      if (btnRestartSudoku) btnRestartSudoku.classList.remove('hidden');

      // Show Sudoku grid size buttons
      if (btnGridS4) btnGridS4.classList.remove('hidden');
      if (btnGridS6) btnGridS6.classList.remove('hidden');
      if (btnGridS9) btnGridS9.classList.remove('hidden');

      if (window.AppSudoku) {
        window.AppSudoku.updateUI();
      }
    } else if (this.activeGame === 'bulls') {
      if (containerBulls) containerBulls.classList.remove('hidden');
      if (tabBulls) tabBulls.classList.add('active');

      // Update header states for Bulls and Cows
      if (portalTitle) portalTitle.textContent = 'Zoo Быки и Коровы 🐮';
      if (portalSubtitle) {
        if (this.gameMode === 'animals') {
          portalSubtitle.textContent = 'Разгадай секретный шифр из животных!';
        } else {
          portalSubtitle.textContent = 'Разгадай секретный шифр из цифр!';
        }
      }
      if (bullsScores) bullsScores.classList.remove('hidden');
      if (settingsGridGroup) settingsGridGroup.classList.remove('hidden');
      if (settingsTypeGroup) settingsTypeGroup.classList.add('hidden');
      if (btnRestartBulls) btnRestartBulls.classList.remove('hidden');

      // Show Bulls grid size buttons
      if (btnGridB3) btnGridB3.classList.remove('hidden');
      if (btnGridB4) btnGridB4.classList.remove('hidden');
      if (btnGridB5) btnGridB5.classList.remove('hidden');

      if (window.AppBulls) {
        window.AppBulls.updateUI();
      }
    } else if (this.activeGame === 'crossword') {
      if (containerCrossword) containerCrossword.classList.remove('hidden');
      if (tabCrossword) tabCrossword.classList.add('active');

      // Update header states for Crossword
      if (portalTitle) portalTitle.textContent = 'Zoo Кроссворд 🧮';
      if (portalSubtitle) {
        if (this.gameMode === 'animals') {
          portalSubtitle.textContent = 'Реши математический кроссворд из животных!';
        } else {
          portalSubtitle.textContent = 'Реши математический кроссворд!';
        }
      }
      if (crosswordScores) crosswordScores.classList.remove('hidden');
      if (settingsGridGroup) settingsGridGroup.classList.remove('hidden');
      if (settingsTypeGroup) settingsTypeGroup.classList.add('hidden');
      if (btnRestartCrossword) btnRestartCrossword.classList.remove('hidden');

      // Show Crossword grid size buttons
      if (btnGridC5) btnGridC5.classList.remove('hidden');
      if (btnGridC7) btnGridC7.classList.remove('hidden');

      if (window.AppCrossword) {
        window.AppCrossword.updateUI();
      }
    } else if (this.activeGame === 'pyramid') {
      if (containerPyramid) containerPyramid.classList.remove('hidden');
      if (tabPyramid) tabPyramid.classList.add('active');
 
      // Update header states for Pyramid
      if (portalTitle) portalTitle.textContent = 'Zoo Пирамида 🔺';
      if (portalSubtitle) {
        if (this.gameMode === 'animals') {
          portalSubtitle.textContent = 'Сложи плитки с животными, чтобы построить пирамиду!';
        } else {
          portalSubtitle.textContent = 'Сложи числа, чтобы построить пирамиду!';
        }
      }
      if (pyramidScores) pyramidScores.classList.remove('hidden');
      if (settingsGridGroup) settingsGridGroup.classList.remove('hidden');
      if (settingsTypeGroup) settingsTypeGroup.classList.add('hidden');
      if (btnRestartPyramid) btnRestartPyramid.classList.remove('hidden');
 
      // Show Pyramid grid size buttons
      if (btnGridP3) btnGridP3.classList.remove('hidden');
      if (btnGridP4) btnGridP4.classList.remove('hidden');
      if (btnGridP5) btnGridP5.classList.remove('hidden');
      if (btnGridP6) btnGridP6.classList.remove('hidden');
 
      if (window.AppPyramid) {
        window.AppPyramid.updateUI();
      }
    }
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
