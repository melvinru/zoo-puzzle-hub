// MinHeap Priority Queue implementation for A*
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(n) {
    const element = this.heap[n];
    const score = element.f;
    while (n > 0) {
      const parentN = Math.floor((n + 1) / 2) - 1;
      const parent = this.heap[parentN];
      if (score >= parent.f) break;
      this.heap[parentN] = element;
      this.heap[n] = parent;
      n = parentN;
    }
  }

  _sinkDown(n) {
    const length = this.heap.length;
    const element = this.heap[n];
    const elemScore = element.f;
    while (true) {
      let child2N = (n + 1) * 2;
      let child1N = child2N - 1;
      let swap = null;
      let child1Score;
      if (child1N < length) {
        const child1 = this.heap[child1N];
        child1Score = child1.f;
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }
      if (child2N < length) {
        const child2 = this.heap[child2N];
        const child2Score = child2.f;
        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }
      if (swap === null) break;
      this.heap[n] = this.heap[swap];
      this.heap[swap] = element;
      n = swap;
    }
  }

  size() {
    return this.heap.length;
  }
}

// Convert character to number (0-15)
function hexToVal(char) {
  if (char >= '0' && char <= '9') {
    return parseInt(char, 10);
  }
  return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
}

// Calculate Manhattan Distance Heuristic
function calculateManhattan(board) {
  let distance = 0;
  for (let i = 0; i < 16; i++) {
    const char = board[i];
    if (char === '0') continue; // Skip blank tile
    const val = hexToVal(char);
    const targetRow = val >> 2;
    const targetCol = val & 3;
    const currRow = i >> 2;
    const currCol = i & 3;
    distance += Math.abs(currRow - targetRow) + Math.abs(currCol - targetCol);
  }
  return distance;
}

// Swap two characters in a string
function swapChars(str, i, j) {
  const arr = str.split('');
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
  return arr.join('');
}

// Run A* Solver
function solve(startBoard, weight, maxIterations = 40000) {
  const goalBoard = "0123456789abcdef";
  const openSet = new MinHeap();
  const closedSet = new Set();
  
  const startBlankIdx = startBoard.indexOf('0');
  const startH = calculateManhattan(startBoard);
  
  openSet.push({
    board: startBoard,
    blankIdx: startBlankIdx,
    g: 0,
    h: startH,
    f: startH * weight,
    parent: null,
    move: null
  });
  
  let iterations = 0;
  
  while (openSet.size() > 0) {
    iterations++;
    if (iterations > maxIterations) {
      return { status: "timeout", iterations };
    }
    
    // Report progress periodically
    if (iterations % 5000 === 0) {
      postMessage({ 
        type: "progress", 
        iterations: iterations, 
        queueSize: openSet.size() 
      });
    }
    
    const current = openSet.pop();
    
    if (current.board === goalBoard) {
      // Reconstruct path
      const path = [];
      let temp = current;
      while (temp !== null) {
        path.push({
          board: temp.board,
          move: temp.move
        });
        temp = temp.parent;
      }
      path.reverse();
      return { 
        status: "solved", 
        path: path, 
        iterations: iterations 
      };
    }
    
    closedSet.add(current.board);
    
    const blankIdx = current.blankIdx;
    const r = blankIdx >> 2;
    const c = blankIdx & 3;
    
    // Neighbor moves: UP, DOWN, LEFT, RIGHT
    const moves = [];
    if (r > 0) moves.push({ nextBlankIdx: blankIdx - 4, dir: "UP" });
    if (r < 3) moves.push({ nextBlankIdx: blankIdx + 4, dir: "DOWN" });
    if (c > 0) moves.push({ nextBlankIdx: blankIdx - 1, dir: "LEFT" });
    if (c < 3) moves.push({ nextBlankIdx: blankIdx + 1, dir: "RIGHT" });
    
    for (const m of moves) {
      const nextBlankIdx = m.nextBlankIdx;
      const nextBoard = swapChars(current.board, blankIdx, nextBlankIdx);
      
      if (closedSet.has(nextBoard)) continue;
      
      const nextG = current.g + 1;
      const nextH = calculateManhattan(nextBoard);
      const nextF = nextG + weight * nextH;
      
      const tileValue = hexToVal(current.board[nextBlankIdx]);
      const moveInfo = {
        tile: tileValue,
        dir: m.dir,
        from: nextBlankIdx,
        to: blankIdx
      };
      
      openSet.push({
        board: nextBoard,
        blankIdx: nextBlankIdx,
        g: nextG,
        h: nextH,
        f: nextF,
        parent: current,
        move: moveInfo
      });
    }
  }
  
  return { status: "unsolvable", iterations };
}

// Web Worker message listener
self.onmessage = function(e) {
  const { board } = e.data;
  
  // Solvability check helper
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
  
  const isSolvable = (blankRow + inversions) % 2 === 0;
  
  if (!isSolvable) {
    postMessage({ type: "error", error: "Данная конфигурация неразрешима!" });
    return;
  }
  
  // Phase 1: Try with small weight for high-quality path (near-optimal)
  postMessage({ type: "status", status: "Анализ оптимального пути (вес 1.5)..." });
  let result = solve(board, 1.5, 35000);
  
  // Phase 2: If too complex, escalate weight for faster resolution
  if (result.status === "timeout") {
    postMessage({ type: "status", status: "Оптимизация поиска (вес 2.5)..." });
    result = solve(board, 2.5, 45000);
  }
  
  // Phase 3: If still complex, use high weight (greedy mode) for instant resolution
  if (result.status === "timeout") {
    postMessage({ type: "status", status: "Быстрое вычисление решения (вес 4.0)..." });
    result = solve(board, 4.0, 75000);
  }
  
  if (result.status === "solved") {
    postMessage({ 
      type: "success", 
      path: result.path, 
      iterations: result.iterations 
    });
  } else {
    postMessage({ 
      type: "error", 
      error: "Не удалось найти решение за разумное число итераций. Пожалуйста, попробуйте другую раскладку." 
    });
  }
};
