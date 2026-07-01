const GameAudio = {
  ctx: null,
  muted: false,

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.ctx = new AudioContext();
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  // OPT-02: single helper replaces repeated init()+resume() at top of every play* method
  _ensureReady() {
    this.init();
    this.resume();
    return !!this.ctx;
  },

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('zoo2048_muted', this.muted);
    } catch (e) {
      console.warn('Could not save mute state:', e);
    }
    return this.muted;
  },

  playSwipe() {
    if (this.muted || !this._ensureReady()) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  },

  playMerge(value) {
    if (this.muted || !this._ensureReady()) return;

    // Pitch increases with the value (2, 4, 8, 16...)
    const steps = Math.log2(value || 2);
    const baseFreq = 260 + steps * 35; // Playful climbing notes

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },

  playUnlock() {
    if (this.muted || !this._ensureReady()) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);

      gain.gain.setValueAtTime(0.0, now + index * 0.07);
      gain.gain.linearRampToValueAtTime(0.15, now + index * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.25);
    });
  },

  playWin() {
    if (this.muted || !this._ensureReady()) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 261.63, d: 0.12 }, // C4
      { f: 329.63, d: 0.12 }, // E4
      { f: 392.00, d: 0.12 }, // G4
      { f: 523.25, d: 0.18 }, // C5
      { f: 392.00, d: 0.12 }, // G4
      { f: 523.25, d: 0.35 }  // C5 (held)
    ];

    let time = now;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.linearRampToValueAtTime(0.15, time + note.d - 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + note.d);
      time += note.d;
    });
  },

  playGameOver() {
    if (this.muted || !this._ensureReady()) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 392.00, d: 0.25 }, // G4
      { f: 349.23, d: 0.25 }, // F4
      { f: 311.13, d: 0.25 }, // Eb4
      { f: 261.63, d: 0.55 }  // C4
    ];

    let time = now;
    melody.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.linearRampToValueAtTime(0.06, time + note.d - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, time + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + note.d);
      time += note.d;
    });
  },

  playClick() {
    if (this.muted || !this._ensureReady()) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }
};

// Load muted state from storage
try {
  GameAudio.muted = localStorage.getItem('zoo2048_muted') === 'true';
} catch (e) {
  console.warn('Could not load mute state:', e);
}

window.GameAudio = GameAudio;
