const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  active: false,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  createParticle(x, y, isMilestone = false) {
    const colors = isMilestone 
      ? ['#FFD700', '#FF8C00', '#FF1493', '#00FFFF', '#32CD32', '#9400D3'] 
      : ['#FF5E7E', '#FFBB00', '#3CD6FF', '#A67CFF', '#50E3C2', '#FF8360'];
    
    const angle = Math.random() * Math.PI * 2;
    const speed = isMilestone ? (Math.random() * 8 + 4) : (Math.random() * 5 + 2);
    const size = Math.random() * 8 + 7;

    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isMilestone ? 4 : 1), 
      size: size,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 12 - 6,
      opacity: 1,
      fadeSpeed: Math.random() * 0.012 + 0.008,
      shape: Math.random() > 0.4 ? 'circle' : (Math.random() > 0.5 ? 'rect' : 'star'),
      gravity: 0.18,
      drag: 0.97
    };
  },

  burst(x, y, count = 25) {
    if (!this.canvas) return;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(x, y, true));
    }
    this.startLoop();
  },

  celebrate(durationMs = 3000) {
    if (!this.canvas) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > durationMs) {
        clearInterval(interval);
        return;
      }
      
      // Rain from top
      const x = Math.random() * this.canvas.width;
      const y = -20;
      for (let i = 0; i < 4; i++) {
        const p = this.createParticle(x, y, false);
        p.vx = Math.random() * 3 - 1.5;
        p.vy = Math.random() * 3 + 3; 
        this.particles.push(p);
      }
      this.startLoop();
    }, 80);
  },

  startLoop() {
    if (this.active) return;
    this.active = true;
    this.loop();
  },

  loop() {
    if (!this.active) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity -= p.fadeSpeed;

      if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'star') {
        this.drawStar(0, 0, 5, p.size / 2, p.size / 4);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.active = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }
};

window.Confetti = Confetti;
