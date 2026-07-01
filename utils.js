// =============================================================================
// utils.js — Общие утилиты Zoo Puzzle Hub
// Подключается первым скриптом в index.html
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Fisher-Yates shuffle — перемешивает массив на месте, возвращает его же
// ---------------------------------------------------------------------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// 2. getGameMode — возвращает текущий режим игры ('animals' | 'numbers')
// ---------------------------------------------------------------------------
function getGameMode() {
  return window.portal?.gameMode ?? 'animals';
}

// ---------------------------------------------------------------------------
// 3. createTileInner — создаёт содержимое плитки (emoji+label или цифру)
//    val     — числовое значение плитки
//    tileMap — объект {val: {emoji, name}} (ANIMAL_TILES / SUDOKU_TILES и т.д.)
//    mode    — 'animals' | 'numbers'
// ---------------------------------------------------------------------------
function createTileInner(val, tileMap, mode) {
  const inner = document.createElement('div');
  inner.className = 'tile-inner';

  if (mode === 'animals') {
    const data = tileMap[val] || { emoji: '👾', name: String(val) };
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
    if (String(val).length > 2 || val >= 1000) num.classList.add('small-font');
    num.textContent = val;
    inner.appendChild(num);
  }

  return inner;
}

// ---------------------------------------------------------------------------
// 4. createMultiDigitTileInner — для Crossword/Pyramid, где значение может быть
//    многозначным (напр. 12 → два эмодзи рядом)
//    val     — числовое значение (может быть 0–99)
//    tileMap — объект {digit: {emoji, name}}
//    mode    — 'animals' | 'numbers'
// ---------------------------------------------------------------------------
function createMultiDigitTileInner(val, tileMap, mode) {
  const inner = document.createElement('div');
  inner.className = 'tile-inner';
  const strVal = String(val);

  if (mode === 'animals') {
    const icon = document.createElement('span');
    icon.className = 'tile-icon';
    icon.textContent = strVal.split('').map(d => (tileMap[parseInt(d)] || { emoji: '?' }).emoji).join('');
    if (strVal.length > 1) {
      icon.style.fontSize = 'clamp(1.1rem, 4.5vw, 1.65rem)';
    }

    const label = document.createElement('span');
    label.className = 'tile-label';
    label.textContent = strVal;

    inner.appendChild(icon);
    inner.appendChild(label);
  } else {
    const num = document.createElement('span');
    num.className = 'tile-number';
    if (strVal.length > 1) {
      num.style.fontSize = 'clamp(1.1rem, 4.5vw, 1.65rem)';
    }
    num.textContent = val;
    inner.appendChild(num);
  }

  return inner;
}

// ---------------------------------------------------------------------------
// 5. renderKeypadButtons — рендерит кнопки keypad в контейнер
//    container  — HTMLElement (keypad div)
//    tileMap    — объект {val: {emoji, name}}
//    values     — массив числовых значений для кнопок
//    mode       — 'animals' | 'numbers'
//    onSelect   — callback(val) при нажатии кнопки
//    extraClass — дополнительный CSS-класс для кнопок (опционально)
//    isDisabled — callback(val) → boolean, кнопка дизейблится если true (опционально)
// ---------------------------------------------------------------------------
function renderKeypadButtons(container, tileMap, values, mode, onSelect, extraClass = '', isDisabled = null) {
  container.innerHTML = '';

  values.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'btn-keypad' + (extraClass ? ' ' + extraClass : '');

    if (isDisabled && isDisabled(val)) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }

    if (mode === 'animals') {
      const data = tileMap[val] || { emoji: '?', name: String(val) };
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

    btn.addEventListener('click', () => onSelect(val));
    container.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// 6. appendEraseButton — добавляет кнопку «Стереть» в keypad
//    container  — HTMLElement
//    onErase    — callback()
//    extraStyle — дополнительные inline-стили объектом (опционально)
// ---------------------------------------------------------------------------
function appendEraseButton(container, onErase, extraStyle = {}) {
  const eraseBtn = document.createElement('button');
  eraseBtn.className = 'btn-keypad erase';
  eraseBtn.title = 'Стереть значение';

  Object.assign(eraseBtn.style, extraStyle);

  const emojiSpan = document.createElement('span');
  emojiSpan.className = 'keypad-emoji';
  emojiSpan.textContent = '❌';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'keypad-label';
  labelSpan.textContent = 'Стереть';

  eraseBtn.appendChild(emojiSpan);
  eraseBtn.appendChild(labelSpan);
  eraseBtn.addEventListener('click', onErase);
  container.appendChild(eraseBtn);
}

// ---------------------------------------------------------------------------
// 7. createWinsStorage — фабрика для load/save побед в localStorage
//    key         — ключ в localStorage
//    defaultObj  — объект по умолчанию, напр. { 4: 0, 6: 0, 9: 0 }
// ---------------------------------------------------------------------------
function createWinsStorage(key, defaultObj) {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : { ...defaultObj };
      } catch {
        return { ...defaultObj };
      }
    },
    save(wins) {
      try {
        localStorage.setItem(key, JSON.stringify(wins));
      } catch (e) {
        console.warn(`Could not save wins [${key}]:`, e);
      }
    }
  };
}

// ---------------------------------------------------------------------------
// 8. showWinModalWith — показывает общий win-modal с кастомным контентом,
//    и восстанавливает оригинальные тексты при закрытии.
//    opts: { title, text, continueText, onContinue, onRestart }
// ---------------------------------------------------------------------------
function showWinModalWith(opts) {
  const winModal = document.getElementById('game-win-modal');
  if (!winModal) return;

  const winTitle = document.getElementById('win-title');
  const modalText = winModal.querySelector('p');
  const continueBtn = winModal.querySelector('.btn-primary');
  const restartBtn = winModal.querySelector('.btn-pill.active');

  const originalTitle = winTitle ? winTitle.innerHTML : '';
  const originalText = modalText ? modalText.innerHTML : '';
  const originalRestartOnclick = restartBtn ? restartBtn.getAttribute('onclick') : null;

  if (winTitle) winTitle.innerHTML = opts.title || '';
  if (modalText) modalText.innerHTML = opts.text || '';

  function restoreModal() {
    if (winTitle) winTitle.innerHTML = originalTitle;
    if (modalText) modalText.innerHTML = originalText;
    if (continueBtn) {
      continueBtn.textContent = 'Продолжить! 💖';
      continueBtn.onclick = null;
      continueBtn.setAttribute('onclick', 'app.closeWinModal(false)');
    }
    if (restartBtn && originalRestartOnclick) {
      restartBtn.onclick = null;
      restartBtn.setAttribute('onclick', originalRestartOnclick);
    }
    winModal.classList.add('hidden');
  }

  if (restartBtn) {
    restartBtn.removeAttribute('onclick');
    restartBtn.onclick = () => {
      if (window.GameAudio) window.GameAudio.playClick();
      restoreModal();
      if (opts.onRestart) opts.onRestart();
    };
  }

  if (continueBtn) {
    continueBtn.classList.remove('hidden');
    continueBtn.textContent = opts.continueText || 'Посмотреть 👀';
    continueBtn.onclick = () => {
      if (window.GameAudio) window.GameAudio.playClick();
      restoreModal();
      if (opts.onContinue) opts.onContinue();
    };
  }

  winModal.classList.remove('hidden');
}
