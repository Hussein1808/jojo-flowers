/* ============================================================
   For Jojo 🌸  —  Night Garden edition
   Glowing petals · Firefly particles · Petal-catch game
   ============================================================ */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 640px)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ==========================================================
     1 · AMBIENT PETAL CANVAS (background layer)
     ========================================================== */
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');
  let DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * DPR;
    canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  /* night-garden palette: glowing pinks, lilacs, warm golds */
  const PALETTE = [
    '#ff6b9d', '#e84393', '#a29bfe', '#fd9644',
    '#55efc4', '#ffeaa7', '#ff9ff3', '#ffffff',
  ];

  const petals = [];

  function makePetal(x, y, burst = false) {
    const size = burst ? (4 + Math.random() * 8) : (3 + Math.random() * 7);
    return {
      x: x ?? Math.random() * innerWidth,
      y: y ?? -20,
      size,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.05,
      vx: burst ? (Math.random() - 0.5) * 5 : (Math.random() - 0.5) * 0.6,
      vy: burst ? -Math.random() * 4 - 1 : 0.4 + Math.random() * 0.9,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.018,
      life: burst ? 100 : Infinity,
      gravity: burst ? 0.1 : 0,
      glowSize: 0.6 + Math.random() * 0.8,
    };
  }

  /* seed ambient petals */
  const AMBIENT = reduceMotion ? 0 : (isSmall ? 20 : Math.min(40, Math.round(innerWidth / 28)));
  for (let i = 0; i < AMBIENT; i++) {
    petals.push(makePetal(Math.random() * innerWidth, Math.random() * innerHeight));
  }

  /* draw a soft, glowing petal shape */
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    const alpha = p.life === Infinity ? 0.75 : Math.min(0.9, p.life / 50);
    const s = p.size;

    /* outer glow */
    ctx.shadowColor = p.color;
    ctx.shadowBlur = s * p.glowSize * 3;

    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.8);
    ctx.quadraticCurveTo(s * 1.2, 0, 0, s * 1.8);
    ctx.quadraticCurveTo(-s * 1.2, 0, 0, -s * 1.8);
    ctx.fill();

    /* bright core */
    ctx.shadowBlur = s * p.glowSize * 1.5;
    ctx.globalAlpha = alpha * 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.4);
    ctx.quadraticCurveTo(s * 0.8, 0, 0, s * 1.4);
    ctx.quadraticCurveTo(-s * 0.8, 0, 0, -s * 1.4);
    ctx.fill();

    ctx.restore();
  }

  /* main ambient animation loop — runs at ~60fps via rAF */
  let lastAmbientTime = 0;
  let ambientSpawnAccum = 0;
  const AMBIENT_SPAWN_RATE = 0.8; // petals per second (gentle rain)

  function tick(now) {
    const dt = lastAmbientTime ? (now - lastAmbientTime) : 16;
    lastAmbientTime = now;

    ctx.clearRect(0, 0, innerWidth, innerHeight);

    /* spawn new ambient petals to keep the count up */
    ambientSpawnAccum += (dt / 1000) * AMBIENT_SPAWN_RATE;
    while (ambientSpawnAccum >= 1) {
      ambientSpawnAccum -= 1;
      if (petals.length < AMBIENT + 10) {
        petals.push(makePetal(Math.random() * innerWidth, -20));
      }
    }

    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway) * 0.5;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rot += p.vr;
      if (p.life !== Infinity) p.life--;
      if (p.life === Infinity) {
        if (p.y > innerHeight + 30) { p.y = -20; p.x = Math.random() * innerWidth; }
        if (p.x > innerWidth + 30) p.x = -20;
        if (p.x < -30) p.x = innerWidth + 20;
      } else if (p.life <= 0 || p.y > innerHeight + 40) {
        petals.splice(i, 1);
        continue;
      }
      drawPetal(p);
    }
    requestAnimationFrame(tick);
  }
  if (!reduceMotion) requestAnimationFrame(tick);

  function spawnBurst(x, y, count = 12) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) petals.push(makePetal(x, y, true));
  }

  /* floating flower emoji */
  function floatFlower(x, y) {
    const f = document.createElement('div');
    f.textContent = ['🌸', '🌷', '🌺', '🌼', '💐'][(Math.random() * 5) | 0];
    Object.assign(f.style, {
      position: 'fixed', left: x + 'px', top: y + 'px',
      fontSize: 16 + Math.random() * 16 + 'px',
      pointerEvents: 'none', zIndex: 50,
      transition: 'transform 1.4s ease-out, opacity 1.4s ease-out',
      transform: 'translate(-50%,-50%)', opacity: '1',
    });
    document.body.appendChild(f);
    requestAnimationFrame(() => {
      f.style.transform = 'translate(-50%,-50%) translateY(-90px) rotate(' + (Math.random() * 60 - 30) + 'deg)';
      f.style.opacity = '0';
    });
    setTimeout(() => f.remove(), 1500);
  }

  /* tap empty space -> a little puff of petals */
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, .blossom, .game-stage')) return;
    spawnBurst(e.clientX, e.clientY, isSmall ? 5 : 7);
  });

  /* ==========================================================
     2 · BOUQUET — roses, lilies, peonies (tap-to-pick game)
     ========================================================== */
  const PALETTES = {
    rose:  [['#ff6b9d', '#e84393'], ['#ff9ff3', '#e84393'], ['#fd9644', '#e17055'],
            ['#ff6b9d', '#c44569'], ['#e84393', '#a83279']],
    peony: [['#ff9ff3', '#e84393'], ['#ff6b9d', '#c44569'], ['#fd9644', '#e17055'],
            ['#a29bfe', '#6c5ce7'], ['#ff9ff3', '#e84393']],
    lily:  [['#ffffff', '#ff9ff3'], ['#dfe6e9', '#a29bfe'], ['#ffeaa7', '#fd9644'],
            ['#dfe6e9', '#b2bec3']],
  };
  const pick = (arr, i) => arr[i % arr.length];

  function rose(c1, c2, s) {
    let out = '';
    for (let i = 0; i < 5; i++) {
      const a = 72 * i;
      out += `<path d="M0 0 C ${-15 * s} ${-11 * s} ${-15 * s} ${-32 * s} 0 ${-36 * s} C ${15 * s} ${-32 * s} ${15 * s} ${-11 * s} 0 0 Z" fill="${c1}" transform="rotate(${a})"/>`;
    }
    for (let i = 0; i < 4; i++) {
      const a = 90 * i + 45;
      out += `<path d="M0 0 C ${-9 * s} ${-7 * s} ${-9 * s} ${-21 * s} 0 ${-23 * s} C ${9 * s} ${-21 * s} ${9 * s} ${-7 * s} 0 0 Z" fill="${c2}" opacity="0.9" transform="rotate(${a})"/>`;
    }
    out += `<circle r="${5.5 * s}" fill="${c2}"/>`;
    out += `<path d="M0 ${-4 * s} A ${4 * s} ${4 * s} 0 1 1 ${-3.4 * s} ${2.2 * s}" fill="none" stroke="${c1}" stroke-width="${1.5 * s}" opacity="0.7"/>`;
    return out;
  }
  function peony(c1, c2, s) {
    let out = '';
    const layers = [
      { n: 9, r: 30, rx: 13, ry: 18, col: c1, off: 0 },
      { n: 8, r: 21, rx: 11, ry: 15, col: c1, off: 20 },
      { n: 7, r: 12, rx: 8,  ry: 11, col: c2, off: 12 },
    ];
    layers.forEach((L) => {
      for (let i = 0; i < L.n; i++) {
        const a = (360 / L.n) * i + L.off;
        out += `<ellipse cx="0" cy="${-L.r * 0.55 * s}" rx="${L.rx * s}" ry="${L.ry * s}" fill="${L.col}" opacity="0.97" transform="rotate(${a})"/>`;
      }
    });
    out += `<circle r="${6 * s}" fill="${c2}"/>`;
    out += `<circle r="${2.4 * s}" fill="#ffeaa7"/>`;
    return out;
  }
  function lily(c1, c2, s) {
    let out = '';
    for (let i = 0; i < 6; i++) {
      const a = 60 * i;
      out += `<path d="M0 0 C ${-8 * s} ${-15 * s} ${-6 * s} ${-32 * s} 0 ${-38 * s} C ${6 * s} ${-32 * s} ${8 * s} ${-15 * s} 0 0 Z" fill="${c1}" transform="rotate(${a})"/>`;
      out += `<line x1="0" y1="${-3 * s}" x2="0" y2="${-30 * s}" stroke="${c2}" stroke-width="${1.1 * s}" opacity="0.55" transform="rotate(${a})"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const a = 60 * i + 12;
      out += `<line x1="0" y1="0" x2="0" y2="${-14 * s}" stroke="#e5a93c" stroke-width="${1.5 * s}" transform="rotate(${a})"/>`;
      out += `<circle cx="0" cy="${-14 * s}" r="${2.2 * s}" fill="#c8791f" transform="rotate(${a})"/>`;
    }
    out += `<circle r="${3.2 * s}" fill="#ffeaa7"/>`;
    return out;
  }
  const RENDER = { rose, peony, lily };

  const BASE = { x: 240, y: 400 };
  const flowers = [
    { x: 240, y: 92,  t: 'peony', s: 1.3 },
    { x: 185, y: 120, t: 'rose',  s: 1.05 },
    { x: 298, y: 120, t: 'rose',  s: 1.05 },
    { x: 150, y: 158, t: 'lily',  s: 1.1 },
    { x: 335, y: 158, t: 'lily',  s: 1.1 },
    { x: 212, y: 150, t: 'peony', s: 1.2 },
    { x: 270, y: 150, t: 'peony', s: 1.2 },
    { x: 120, y: 212, t: 'rose',  s: 1.0 },
    { x: 362, y: 212, t: 'rose',  s: 1.0 },
    { x: 172, y: 205, t: 'lily',  s: 1.0 },
    { x: 312, y: 205, t: 'lily',  s: 1.0 },
    { x: 242, y: 200, t: 'rose',  s: 1.1 },
    { x: 200, y: 250, t: 'peony', s: 1.05 },
    { x: 284, y: 250, t: 'peony', s: 1.05 },
  ];
  const TOTAL = flowers.length;

  const stemsG = document.querySelector('.stems');
  const leavesG = document.querySelector('.leaves');
  const blossomsG = document.querySelector('.blossoms');
  const typeIdx = { rose: 0, peony: 0, lily: 0 };

  /* ---- the bouquet game (tap to pick) ---- */
  const verdict = document.getElementById('verdict');
  const progress = document.getElementById('progress');
  const PHRASES = [
    'loves you 🌸', 'loves you a lot', 'loves you more', 'adores you',
    'can\'t stop 🌷', 'loves you even more', 'you\'re her favourite',
    'loves you, obviously', 'crazy about you', 'loves you the most 💐',
    'you again? loves you', 'still loves you', 'loves you endlessly',
  ];
  const picked = new Set();
  let taps = 0;

  function playFlower(bl, idx) {
    if (!reduceMotion && bl.animate) {
      bl.animate(
        [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(1.4) rotate(-12deg)' },
          { transform: 'scale(1.12) rotate(10deg)' },
          { transform: 'scale(1) rotate(0deg)' },
        ],
        { duration: 550, easing: 'cubic-bezier(.34,1.7,.5,1)' }
      );
    }
    bl.classList.add('picked');
    const r = bl.getBoundingClientRect();
    spawnBurst(r.left + r.width / 2, r.top + r.height / 2, 14);

    picked.add(idx);
    const done = picked.size >= TOTAL;
    verdict.textContent = done
      ? 'every flower loves you 🌸'
      : PHRASES[taps % PHRASES.length];
    taps++;
    verdict.classList.remove('pulse'); void verdict.offsetWidth; verdict.classList.add('pulse');
    progress.textContent = done ? 'all 14 picked — she\'s sure 💐' : `${picked.size} / ${TOTAL} picked`;
  }

  flowers.forEach((f, i) => {
    const c1x = BASE.x + (f.x - BASE.x) * 0.15, c1y = 348;
    const c2x = f.x + (f.x - BASE.x) * 0.15, c2y = f.y + 72;
    const stem = document.createElementNS(SVGNS, 'path');
    stem.setAttribute('d', `M${BASE.x} ${BASE.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${f.x} ${f.y + 16}`);
    stem.style.animationDelay = `${0.4 + i * 0.06}s`;
    stemsG.appendChild(stem);

    const pos = document.createElementNS(SVGNS, 'g');
    pos.setAttribute('transform', `translate(${f.x} ${f.y})`);
    const bl = document.createElementNS(SVGNS, 'g');
    bl.setAttribute('class', 'blossom');
    bl.style.setProperty('--i', i);
    const [c1, c2] = pick(PALETTES[f.t], typeIdx[f.t]++);
    bl.innerHTML = `<circle r="${30 * f.s}" fill="transparent"/>` + RENDER[f.t](c1, c2, f.s);
    bl.addEventListener('pointerdown', (e) => { e.stopPropagation(); playFlower(bl, i); });
    pos.appendChild(bl);
    blossomsG.appendChild(pos);
  });

  [[188, 300, -34], [292, 300, 34], [162, 342, -50], [318, 342, 50], [240, 322, 0]].forEach((L, i) => {
    const e = document.createElementNS(SVGNS, 'ellipse');
    e.setAttribute('class', 'leaf');
    e.setAttribute('cx', L[0]); e.setAttribute('cy', L[1]);
    e.setAttribute('rx', 10); e.setAttribute('ry', 22);
    e.setAttribute('transform', `rotate(${L[2]} ${L[0]} ${L[1]})`);
    e.style.setProperty('--d', `${1.4 + i * 0.15}s`);
    leavesG.appendChild(e);
  });

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ==========================================================
     3 · PETAL-CATCH GAME — "Catch the Falling Petals"
     ========================================================== */
  const gameStage    = document.getElementById('gameStage');
  const gameCanvas   = document.getElementById('gameCanvas');
  const startBtn     = document.getElementById('gameStartBtn');
  const scoreEl      = document.getElementById('gameScore');
  const timerEl      = document.getElementById('gameTimer');
  const resultEl     = document.getElementById('gameResult');

  if (gameCanvas && !reduceMotion) {
    const gctx = gameCanvas.getContext('2d');
    let gW, gH, gDPR;

    function resizeGame() {
      gDPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = gameStage.getBoundingClientRect();
      gW = rect.width;
      gH = rect.height;
      gameCanvas.width = gW * gDPR;
      gameCanvas.height = gH * gDPR;
      gctx.setTransform(gDPR, 0, 0, gDPR, 0, 0);
    }
    resizeGame();
    addEventListener('resize', resizeGame);

    /* game state */
    const GAME_DURATION = 30; // seconds
    let gameRunning = false;
    let gameScore = 0;
    let gameTimeLeft = GAME_DURATION;
    let gameAnimId = null;
    let lastGameTime = 0;
    let spawnAccum = 0;

    /* game petal pool */
    const gamePetals = [];
    const GAME_COLORS = [
      { color: '#ff6b9d', points: 1, name: 'pink' },
      { color: '#ffeaa7', points: 2, name: 'gold' },
      { color: '#55efc4', points: 3, name: 'mint' },
      { color: '#a29bfe', points: 2, name: 'lilac' },
      { color: '#ff9ff3', points: 1, name: 'magenta' },
      { color: '#ffffff', points: 5, name: 'white' },  // rare!
    ];

    function makeGamePetal() {
      const colorData = GAME_COLORS[(Math.random() * GAME_COLORS.length) | 0];
      /* rare white petals are less common */
      const finalColor = (colorData.name === 'white' && Math.random() > 0.12)
        ? GAME_COLORS[0] : colorData;

      const size = 8 + Math.random() * 12;
      return {
        x: 20 + Math.random() * (gW - 40),
        y: -size * 2,
        size,
        color: finalColor.color,
        points: finalColor.points,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.04,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.8 + Math.random() * 1.5,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.01 + Math.random() * 0.02,
        caught: false,
        catchAnim: 0,
        glowSize: 0.8 + Math.random() * 0.6,
      };
    }

    /* draw glowing game petal */
    function drawGamePetal(p) {
      gctx.save();
      gctx.translate(p.x, p.y);
      gctx.rotate(p.rot);

      if (p.caught) {
        /* catch animation: scale up + fade out */
        const t = p.catchAnim / 20;
        const scale = 1 + t * 1.5;
        const alpha = 1 - t;
        gctx.scale(scale, scale);
        gctx.globalAlpha = alpha;
      }

      const s = p.size;

      /* outer glow */
      gctx.shadowColor = p.color;
      gctx.shadowBlur = s * p.glowSize * 4;
      gctx.fillStyle = p.color;
      gctx.globalAlpha = (p.caught ? gctx.globalAlpha : 1) * 0.35;
      gctx.beginPath();
      gctx.moveTo(0, -s * 1.8);
      gctx.quadraticCurveTo(s * 1.3, 0, 0, s * 1.8);
      gctx.quadraticCurveTo(-s * 1.3, 0, 0, -s * 1.8);
      gctx.fill();

      /* bright core */
      gctx.shadowBlur = s * p.glowSize * 2;
      gctx.globalAlpha = (p.caught ? gctx.globalAlpha * 2 : 1) * 0.9;
      gctx.beginPath();
      gctx.moveTo(0, -s * 1.4);
      gctx.quadraticCurveTo(s, 0, 0, s * 1.4);
      gctx.quadraticCurveTo(-s, 0, 0, -s * 1.4);
      gctx.fill();

      gctx.restore();
    }

    /* floating score indicator */
    function showScorePopup(x, y, pts) {
      gctx.save();
      gctx.font = `bold ${16 + pts * 2}px 'Quicksand', sans-serif`;
      gctx.fillStyle = pts >= 3 ? '#55efc4' : (pts >= 2 ? '#ffeaa7' : '#ff6b9d');
      gctx.shadowColor = gctx.fillStyle;
      gctx.shadowBlur = 12;
      gctx.textAlign = 'center';
      gctx.globalAlpha = 0.9;
      gctx.fillText(`+${pts}`, x, y);
      gctx.restore();
    }

    /* check if a point is inside a petal's hit area */
    function hitTest(px, py, p) {
      const dx = px - p.x;
      const dy = py - p.y;
      const hitR = p.size * 2.2; // generous hit area for mobile
      return (dx * dx + dy * dy) < (hitR * hitR);
    }

    /* handle taps/clicks in game stage */
    gameStage.addEventListener('pointerdown', (e) => {
      if (!gameRunning) return;
      const rect = gameStage.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      /* check petals in reverse (top-most first) */
      for (let i = gamePetals.length - 1; i >= 0; i--) {
        const p = gamePetals[i];
        if (!p.caught && hitTest(px, py, p)) {
          p.caught = true;
          p.catchAnim = 0;
          gameScore += p.points;
          scoreEl.textContent = gameScore;

          /* burst petals from catch point into the ambient canvas */
          const stageRect = gameStage.getBoundingClientRect();
          spawnBurst(stageRect.left + p.x, stageRect.top + p.y, 6);
          break; // one catch per tap
        }
      }
    });

    /* game tick — spawns, physics, rendering */
    const SPAWN_RATE_BASE = 2.5;  // petals per second at start
    const SPAWN_RATE_MAX = 6;     // petals per second at end
    const FALL_SPEED_BASE = 1.0;
    const FALL_SPEED_MAX = 2.2;

    function gameLoop(now) {
      if (!gameRunning) return;
      const dt = lastGameTime ? Math.min(now - lastGameTime, 50) : 16; // cap dt at 50ms
      lastGameTime = now;

      /* update timer */
      gameTimeLeft -= dt / 1000;
      if (gameTimeLeft <= 0) {
        endGame();
        return;
      }
      timerEl.textContent = Math.ceil(gameTimeLeft) + 's';

      /* difficulty ramp */
      const progress = 1 - (gameTimeLeft / GAME_DURATION);
      const spawnRate = SPAWN_RATE_BASE + (SPAWN_RATE_MAX - SPAWN_RATE_BASE) * progress;
      const speedMult = FALL_SPEED_BASE + (FALL_SPEED_MAX - FALL_SPEED_BASE) * progress;

      /* spawn petals — accumulator-based for frame-rate independence */
      spawnAccum += (dt / 1000) * spawnRate;
      while (spawnAccum >= 1) {
        spawnAccum -= 1;
        const p = makeGamePetal();
        p.vy *= speedMult;
        gamePetals.push(p);
      }

      /* clear */
      gctx.clearRect(0, 0, gW, gH);

      /* update & draw petals */
      for (let i = gamePetals.length - 1; i >= 0; i--) {
        const p = gamePetals[i];

        if (p.caught) {
          p.catchAnim++;
          if (p.catchAnim > 20) {
            gamePetals.splice(i, 1);
            continue;
          }
        } else {
          p.sway += p.swaySpeed;
          p.x += p.vx + Math.sin(p.sway) * 0.5;
          p.y += p.vy;
          p.rot += p.vr;

          /* remove if off screen */
          if (p.y > gH + p.size * 2) {
            gamePetals.splice(i, 1);
            continue;
          }
        }

        drawGamePetal(p);

        /* show score popup for recently caught petals */
        if (p.caught && p.catchAnim < 15) {
          showScorePopup(p.x, p.y - p.size - 10 - p.catchAnim * 2, p.points);
        }
      }

      gameAnimId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
      gameScore = 0;
      gameTimeLeft = GAME_DURATION;
      gamePetals.length = 0;
      spawnAccum = 0;
      lastGameTime = 0;
      gameRunning = true;
      scoreEl.textContent = '0';
      timerEl.textContent = GAME_DURATION + 's';
      resultEl.classList.remove('show');
      resultEl.textContent = '';
      startBtn.disabled = true;
      startBtn.querySelector('span').textContent = 'catching...';
      resizeGame();
      gameAnimId = requestAnimationFrame(gameLoop);
    }

    function endGame() {
      gameRunning = false;
      if (gameAnimId) cancelAnimationFrame(gameAnimId);

      /* final clear with a fade */
      gctx.clearRect(0, 0, gW, gH);

      startBtn.disabled = false;
      startBtn.querySelector('span').textContent = 'play again 🌸';

      /* show result */
      let msg;
      if (gameScore >= 80)      msg = `${gameScore} petals! 🌸 a night garden master!`;
      else if (gameScore >= 50) msg = `${gameScore} petals! ✨ beautifully done!`;
      else if (gameScore >= 25) msg = `${gameScore} petals! 🌷 lovely catch!`;
      else                      msg = `${gameScore} petals! 🌱 try again?`;
      resultEl.textContent = msg;
      resultEl.classList.add('show');

      /* celebration burst */
      const stageRect = gameStage.getBoundingClientRect();
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          spawnBurst(
            stageRect.left + Math.random() * stageRect.width,
            stageRect.top + Math.random() * stageRect.height * 0.5,
            4
          );
        }, i * 60);
      }
    }

    startBtn.addEventListener('click', startGame);
  }

  /* ==========================================================
     4 · FINALE — flower shower
     ========================================================== */
  const giftBtn = document.getElementById('giftBtn');
  const finaleMsg = document.getElementById('finaleMsg');
  if (giftBtn) {
    giftBtn.addEventListener('click', () => {
      let n = 0;
      const iv = setInterval(() => {
        for (let i = 0; i < (isSmall ? 4 : 6); i++) {
          const p = makePetal(Math.random() * innerWidth, -20);
          p.vy = 1.5 + Math.random() * 2;
          petals.push(p);
        }
        if (++n > 34) clearInterval(iv);
      }, 60);
      for (let i = 0; i < 22; i++) {
        setTimeout(() => floatFlower(Math.random() * innerWidth, innerHeight - 40), i * 80);
      }
      finaleMsg.classList.add('show');
      giftBtn.querySelector('span').textContent = 'they\'re all yours 🌸';
    });
  }

  /* ==========================================================
     5 · AMBIENT CHIMES (off by default)
     ========================================================== */
  const muteBtn = document.getElementById('muteBtn');
  let audioCtx = null, playing = false, master = null;
  function startAmbient() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5 — pentatonic
    master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 2);
    (function chime() {
      if (!playing) return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[(Math.random() * notes.length) | 0] * (Math.random() < 0.3 ? 2 : 1);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);
      osc.connect(g); g.connect(master);
      osc.start(); osc.stop(audioCtx.currentTime + 3.2);
      setTimeout(chime, 1200 + Math.random() * 2400);
    })();
  }
  if (muteBtn) muteBtn.addEventListener('click', () => {
    if (!playing) { playing = true; startAmbient(); muteBtn.textContent = '🔊'; }
    else { playing = false; try { master && master.disconnect(); } catch (_) {} muteBtn.textContent = '🔈'; }
  });
})();
