/* ============================================================
   For Jojo 🌸  —  Night Garden
   Catch petals → they become flowers in your bouquet
   ============================================================ */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 640px)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ==========================================================
     AMBIENT PETAL CANVAS
     ========================================================== */
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');

  function resizeAmbient() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * d;
    canvas.height = innerHeight * d;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  resizeAmbient();
  addEventListener('resize', resizeAmbient);

  const PALETTE = ['#ff6b9d','#e84393','#a29bfe','#fd9644','#55efc4','#ffeaa7','#ff9ff3','#fff'];
  const ambientPetals = [];

  function makeAmbient(x, y, burst) {
    const s = burst ? (4 + Math.random() * 8) : (3 + Math.random() * 6);
    return {
      x: x ?? Math.random() * innerWidth, y: y ?? -20, size: s,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * .05,
      vx: burst ? (Math.random() - .5) * 5 : (Math.random() - .5) * .5,
      vy: burst ? -Math.random() * 4 - 1 : .35 + Math.random() * .8,
      sw: Math.random() * Math.PI * 2, swS: .008 + Math.random() * .016,
      life: burst ? 100 : Infinity, grav: burst ? .1 : 0,
      glow: .6 + Math.random() * .7,
    };
  }
  const AMB_COUNT = reduceMotion ? 0 : (isSmall ? 18 : Math.min(36, Math.round(innerWidth / 30)));
  for (let i = 0; i < AMB_COUNT; i++) ambientPetals.push(makeAmbient(Math.random() * innerWidth, Math.random() * innerHeight));

  function drawGlowPetal(c, p) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
    const a = p.life === Infinity ? .7 : Math.min(.85, p.life / 50);
    const s = p.size;
    c.shadowColor = p.color; c.shadowBlur = s * p.glow * 3;
    c.fillStyle = p.color; c.globalAlpha = a * .35;
    c.beginPath(); c.moveTo(0, -s * 1.7); c.quadraticCurveTo(s * 1.1, 0, 0, s * 1.7); c.quadraticCurveTo(-s * 1.1, 0, 0, -s * 1.7); c.fill();
    c.shadowBlur = s * p.glow * 1.5; c.globalAlpha = a * .85;
    c.beginPath(); c.moveTo(0, -s * 1.3); c.quadraticCurveTo(s * .7, 0, 0, s * 1.3); c.quadraticCurveTo(-s * .7, 0, 0, -s * 1.3); c.fill();
    c.restore();
  }

  let ambT = 0, ambSpawn = 0;
  function ambientTick(now) {
    const dt = ambT ? (now - ambT) : 16; ambT = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ambSpawn += (dt / 1000) * .6;
    while (ambSpawn >= 1) { ambSpawn--; if (ambientPetals.length < AMB_COUNT + 8) ambientPetals.push(makeAmbient()); }
    for (let i = ambientPetals.length - 1; i >= 0; i--) {
      const p = ambientPetals[i];
      p.sw += p.swS; p.x += p.vx + Math.sin(p.sw) * .4; p.y += p.vy; p.vy += p.grav; p.rot += p.vr;
      if (p.life !== Infinity) p.life--;
      if (p.life === Infinity) {
        if (p.y > innerHeight + 30) { p.y = -20; p.x = Math.random() * innerWidth; }
        if (p.x > innerWidth + 30) p.x = -20; if (p.x < -30) p.x = innerWidth + 20;
      } else if (p.life <= 0 || p.y > innerHeight + 40) { ambientPetals.splice(i, 1); continue; }
      drawGlowPetal(ctx, p);
    }
    requestAnimationFrame(ambientTick);
  }
  if (!reduceMotion) requestAnimationFrame(ambientTick);

  function spawnBurst(x, y, n = 10) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) ambientPetals.push(makeAmbient(x, y, true));
  }

  addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, .game-stage')) return;
    spawnBurst(e.clientX, e.clientY, isSmall ? 4 : 6);
  });

  /* ==========================================================
     PETAL-CATCH GAME
     ========================================================== */
  const gameStage   = document.getElementById('gameStage');
  const gameCanvas  = document.getElementById('gameCanvas');
  const startBtn    = document.getElementById('gameStartBtn');
  const overlay     = document.getElementById('gameOverlay');
  const overlayText = document.getElementById('overlayText');
  const caughtEl    = document.getElementById('gameCaught');
  const timerEl     = document.getElementById('gameTimer');
  const resultEl    = document.getElementById('gameResult');

  const gctx = gameCanvas ? gameCanvas.getContext('2d') : null;
  let gW, gH;

  function resizeGame() {
    if (!gameStage) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const r = gameStage.getBoundingClientRect();
    gW = r.width; gH = r.height;
    gameCanvas.width = gW * d; gameCanvas.height = gH * d;
    gctx.setTransform(d, 0, 0, d, 0, 0);
  }
  if (gameCanvas) { resizeGame(); addEventListener('resize', resizeGame); }

  const GAME_DUR = 15;
  let gameOn = false, caught = 0, timeLeft = GAME_DUR, gAnimId, gLastT = 0, gSpawn = 0;
  const gPetals = [];

  const G_COLORS = [
    { c: '#ff6b9d', w: 5 }, { c: '#ffeaa7', w: 3 }, { c: '#55efc4', w: 2 },
    { c: '#a29bfe', w: 3 }, { c: '#ff9ff3', w: 4 }, { c: '#ffffff', w: 1 },
  ];
  const colorPool = []; G_COLORS.forEach(e => { for (let i = 0; i < e.w; i++) colorPool.push(e.c); });

  function makeGP() {
    const s = 8 + Math.random() * 11;
    return {
      x: 16 + Math.random() * (gW - 32), y: -s * 2, size: s,
      color: colorPool[(Math.random() * colorPool.length) | 0],
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * .04,
      vx: (Math.random() - .5) * .3, vy: .7 + Math.random() * 1.2,
      sw: Math.random() * Math.PI * 2, swS: .01 + Math.random() * .018,
      caught: false, anim: 0, glow: .7 + Math.random() * .5,
    };
  }

  function drawGP(p) {
    gctx.save(); gctx.translate(p.x, p.y); gctx.rotate(p.rot);
    let alpha = 1;
    if (p.caught) {
      const t = p.anim / 18;
      gctx.scale(1 + t * 1.5, 1 + t * 1.5); alpha = 1 - t;
    }
    const s = p.size;
    gctx.shadowColor = p.color; gctx.shadowBlur = s * p.glow * 4;
    gctx.fillStyle = p.color; gctx.globalAlpha = alpha * .3;
    gctx.beginPath(); gctx.moveTo(0, -s * 1.7); gctx.quadraticCurveTo(s * 1.2, 0, 0, s * 1.7); gctx.quadraticCurveTo(-s * 1.2, 0, 0, -s * 1.7); gctx.fill();
    gctx.shadowBlur = s * p.glow * 1.8; gctx.globalAlpha = alpha * .9;
    gctx.beginPath(); gctx.moveTo(0, -s * 1.3); gctx.quadraticCurveTo(s * .9, 0, 0, s * 1.3); gctx.quadraticCurveTo(-s * .9, 0, 0, -s * 1.3); gctx.fill();
    gctx.restore();
  }

  function hitTest(px, py, p) {
    const dx = px - p.x, dy = py - p.y, r = p.size * 2.2;
    return dx * dx + dy * dy < r * r;
  }

  if (gameStage) gameStage.addEventListener('pointerdown', (e) => {
    if (!gameOn) return;
    const r = gameStage.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    for (let i = gPetals.length - 1; i >= 0; i--) {
      const p = gPetals[i];
      if (!p.caught && hitTest(px, py, p)) {
        p.caught = true; p.anim = 0; caught++;
        caughtEl.textContent = caught;
        const sr = gameStage.getBoundingClientRect();
        spawnBurst(sr.left + p.x, sr.top + p.y, 5);
        break;
      }
    }
  });

  function gameLoop(now) {
    if (!gameOn) return;
    const dt = gLastT ? Math.min(now - gLastT, 50) : 16; gLastT = now;

    timeLeft -= dt / 1000;
    if (timeLeft <= 0) { endGame(); return; }
    timerEl.textContent = Math.ceil(timeLeft) + 's';

    const prog = 1 - timeLeft / GAME_DUR;
    const rate = 2.5 + 4 * prog;
    const speed = 1 + 1.2 * prog;

    gSpawn += (dt / 1000) * rate;
    while (gSpawn >= 1) { gSpawn--; const p = makeGP(); p.vy *= speed; gPetals.push(p); }

    gctx.clearRect(0, 0, gW, gH);
    for (let i = gPetals.length - 1; i >= 0; i--) {
      const p = gPetals[i];
      if (p.caught) { p.anim++; if (p.anim > 18) { gPetals.splice(i, 1); continue; } }
      else {
        p.sw += p.swS; p.x += p.vx + Math.sin(p.sw) * .4; p.y += p.vy; p.rot += p.vr;
        if (p.y > gH + p.size * 2) { gPetals.splice(i, 1); continue; }
      }
      drawGP(p);
      if (p.caught && p.anim < 12) {
        gctx.save();
        gctx.font = `bold ${14 + (p.color === '#ffffff' ? 4 : 0)}px 'Quicksand',sans-serif`;
        gctx.fillStyle = p.color; gctx.shadowColor = p.color; gctx.shadowBlur = 10;
        gctx.textAlign = 'center'; gctx.globalAlpha = 1 - p.anim / 12;
        gctx.fillText('+1', p.x, p.y - p.size - 8 - p.anim * 2);
        gctx.restore();
      }
    }
    gAnimId = requestAnimationFrame(gameLoop);
  }

  function startGame() {
    caught = 0; timeLeft = GAME_DUR; gPetals.length = 0; gSpawn = 0; gLastT = 0;
    gameOn = true;
    caughtEl.textContent = '0'; timerEl.textContent = GAME_DUR + 's';
    resultEl.classList.remove('show'); resultEl.textContent = '';
    overlay.classList.add('hidden');
    resizeGame();
    gAnimId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameOn = false;
    if (gAnimId) cancelAnimationFrame(gAnimId);
    gctx.clearRect(0, 0, gW, gH);

    overlay.classList.remove('hidden');
    overlayText.innerHTML = `you caught <strong>${caught}</strong> petal${caught !== 1 ? 's' : ''}!<br>scroll down to see your bouquet`;
    startBtn.querySelector('span').textContent = 'play again 🌸';

    let msg;
    if (caught >= 20) msg = `${caught} petals! 🌸 a magnificent bouquet!`;
    else if (caught >= 12) msg = `${caught} petals! ✨ a beautiful garden!`;
    else if (caught >= 6) msg = `${caught} petals! 🌷 a lovely bunch!`;
    else msg = `${caught} petals! 🌱 a sweet start`;
    resultEl.textContent = msg;
    resultEl.classList.add('show');

    buildBouquet(caught);

    const sr = gameStage.getBoundingClientRect();
    for (let i = 0; i < Math.min(caught, 20); i++) {
      setTimeout(() => spawnBurst(sr.left + Math.random() * sr.width, sr.top + Math.random() * sr.height * .5, 3), i * 50);
    }
  }

  if (startBtn) startBtn.addEventListener('click', startGame);

  /* ==========================================================
     BOUQUET — flowers = caught petals
     ========================================================== */
  const bouquetSection = document.getElementById('bouquet');
  const bouquetReveal  = document.getElementById('bouquetReveal');
  const bouquetTitle   = document.getElementById('bouquetTitle');
  const bouquetCountEl = document.getElementById('bouquetCount');
  const verdictEl      = document.getElementById('verdict');
  const stemsG    = document.querySelector('.stems');
  const leavesG   = document.querySelector('.leaves');
  const blossomsG = document.querySelector('.blossoms');

  const PALETTES = {
    rose:  [['#ff6b9d','#e84393'],['#ff9ff3','#e84393'],['#fd9644','#e17055'],['#ff6b9d','#c44569'],['#e84393','#a83279']],
    peony: [['#ff9ff3','#e84393'],['#ff6b9d','#c44569'],['#fd9644','#e17055'],['#a29bfe','#6c5ce7'],['#ff9ff3','#e84393']],
    lily:  [['#ffffff','#ff9ff3'],['#dfe6e9','#a29bfe'],['#ffeaa7','#fd9644'],['#dfe6e9','#b2bec3']],
  };
  const pickC = (a, i) => a[i % a.length];
  const BASE = { x: 240, y: 400 };

  /* all 14 possible flower positions */
  const SLOTS = [
    { x: 240, y: 92,  t: 'peony', s: 1.3  },
    { x: 185, y: 120, t: 'rose',  s: 1.05 },
    { x: 298, y: 120, t: 'rose',  s: 1.05 },
    { x: 150, y: 158, t: 'lily',  s: 1.1  },
    { x: 335, y: 158, t: 'lily',  s: 1.1  },
    { x: 212, y: 150, t: 'peony', s: 1.2  },
    { x: 270, y: 150, t: 'peony', s: 1.2  },
    { x: 120, y: 212, t: 'rose',  s: 1.0  },
    { x: 362, y: 212, t: 'rose',  s: 1.0  },
    { x: 172, y: 205, t: 'lily',  s: 1.0  },
    { x: 312, y: 205, t: 'lily',  s: 1.0  },
    { x: 242, y: 200, t: 'rose',  s: 1.1  },
    { x: 200, y: 250, t: 'peony', s: 1.05 },
    { x: 284, y: 250, t: 'peony', s: 1.05 },
  ];

  function rose(c1, c2, s) {
    let o = '';
    for (let i = 0; i < 5; i++) { const a = 72 * i; o += `<path d="M0 0 C ${-15*s} ${-11*s} ${-15*s} ${-32*s} 0 ${-36*s} C ${15*s} ${-32*s} ${15*s} ${-11*s} 0 0 Z" fill="${c1}" transform="rotate(${a})"/>`; }
    for (let i = 0; i < 4; i++) { const a = 90 * i + 45; o += `<path d="M0 0 C ${-9*s} ${-7*s} ${-9*s} ${-21*s} 0 ${-23*s} C ${9*s} ${-21*s} ${9*s} ${-7*s} 0 0 Z" fill="${c2}" opacity=".9" transform="rotate(${a})"/>`; }
    o += `<circle r="${5.5*s}" fill="${c2}"/>`;
    return o;
  }
  function peony(c1, c2, s) {
    let o = '';
    [{n:9,r:30,rx:13,ry:18,col:c1,off:0},{n:8,r:21,rx:11,ry:15,col:c1,off:20},{n:7,r:12,rx:8,ry:11,col:c2,off:12}]
      .forEach(L => { for (let i = 0; i < L.n; i++) { const a = (360/L.n)*i+L.off; o += `<ellipse cx="0" cy="${-L.r*.55*s}" rx="${L.rx*s}" ry="${L.ry*s}" fill="${L.col}" opacity=".97" transform="rotate(${a})"/>`; }});
    o += `<circle r="${6*s}" fill="${c2}"/><circle r="${2.4*s}" fill="#ffeaa7"/>`;
    return o;
  }
  function lily(c1, c2, s) {
    let o = '';
    for (let i = 0; i < 6; i++) { const a = 60*i; o += `<path d="M0 0 C ${-8*s} ${-15*s} ${-6*s} ${-32*s} 0 ${-38*s} C ${6*s} ${-32*s} ${8*s} ${-15*s} 0 0 Z" fill="${c1}" transform="rotate(${a})"/>`; o += `<line x1="0" y1="${-3*s}" x2="0" y2="${-30*s}" stroke="${c2}" stroke-width="${1.1*s}" opacity=".5" transform="rotate(${a})"/>`; }
    for (let i = 0; i < 6; i++) { const a = 60*i+12; o += `<line x1="0" y1="0" x2="0" y2="${-14*s}" stroke="#e5a93c" stroke-width="${1.5*s}" transform="rotate(${a})"/>`; o += `<circle cx="0" cy="${-14*s}" r="${2.2*s}" fill="#c8791f" transform="rotate(${a})"/>`; }
    o += `<circle r="${3.2*s}" fill="#ffeaa7"/>`;
    return o;
  }
  const RENDER = { rose, peony, lily };

  function buildBouquet(count) {
    /* clear any previous bouquet */
    stemsG.innerHTML = ''; leavesG.innerHTML = ''; blossomsG.innerHTML = '';

    const n = Math.min(count, SLOTS.length); // cap at 14
    const tIdx = { rose: 0, peony: 0, lily: 0 };

    for (let i = 0; i < n; i++) {
      const f = SLOTS[i];
      /* stem */
      const c1x = BASE.x + (f.x - BASE.x) * .15, c1y = 348;
      const c2x = f.x + (f.x - BASE.x) * .15, c2y = f.y + 72;
      const stem = document.createElementNS(SVGNS, 'path');
      stem.setAttribute('d', `M${BASE.x} ${BASE.y} C ${c1x} ${c1y} ${c2x} ${c2y} ${f.x} ${f.y + 16}`);
      stem.style.animationDelay = `${.3 + i * .08}s`;
      stemsG.appendChild(stem);

      /* blossom */
      const pos = document.createElementNS(SVGNS, 'g');
      pos.setAttribute('transform', `translate(${f.x} ${f.y})`);
      const bl = document.createElementNS(SVGNS, 'g');
      bl.setAttribute('class', 'blossom');
      bl.style.setProperty('--i', i);
      const [cl1, cl2] = pickC(PALETTES[f.t], tIdx[f.t]++);
      bl.innerHTML = RENDER[f.t](cl1, cl2, f.s);
      pos.appendChild(bl);
      blossomsG.appendChild(pos);
    }

    /* leaves (always show some) */
    [[188,300,-34],[292,300,34],[162,342,-50],[318,342,50],[240,322,0]].forEach((L, i) => {
      if (i >= Math.ceil(n / 2.5)) return; // fewer leaves for fewer flowers
      const e = document.createElementNS(SVGNS, 'ellipse');
      e.setAttribute('class', 'leaf');
      e.setAttribute('cx', L[0]); e.setAttribute('cy', L[1]);
      e.setAttribute('rx', 10); e.setAttribute('ry', 22);
      e.setAttribute('transform', `rotate(${L[2]} ${L[0]} ${L[1]})`);
      e.style.setProperty('--d', `${1 + i * .15}s`);
      leavesG.appendChild(e);
    });

    /* update text */
    const flowerWord = n === 1 ? 'flower' : 'flowers';
    bouquetCountEl.textContent = `${n} ${flowerWord} bloomed from ${count} petals`;
    if (n >= 14) verdictEl.textContent = 'You always deserve flowers 🌸❤️';
    else if (n >= 10) verdictEl.textContent = 'she really loves you 🌷';
    else if (n >= 6) verdictEl.textContent = 'growing beautifully 🌺';
    else if (n >= 1) verdictEl.textContent = 'every petal counts 🌱';
    else verdictEl.textContent = '';

    /* reveal the section */
    bouquetSection.classList.add('revealed');

    /* scroll into view after a beat */
    setTimeout(() => {
      bouquetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);
  }

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .25 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ==========================================================
     FINALE — flower shower
     ========================================================== */
  const giftBtn = document.getElementById('giftBtn');
  const finaleMsg = document.getElementById('finaleMsg');
  if (giftBtn) giftBtn.addEventListener('click', () => {
    giftBtn.style.transition = 'opacity .4s ease';
    giftBtn.style.opacity = '0';
    setTimeout(() => giftBtn.style.display = 'none', 400);
    let n = 0;
    const iv = setInterval(() => {
      for (let i = 0; i < (isSmall ? 4 : 6); i++) {
        const p = makeAmbient(Math.random() * innerWidth, -20);
        p.vy = 1.5 + Math.random() * 2;
        ambientPetals.push(p);
      }
      if (++n > 34) clearInterval(iv);
    }, 60);
  });

  /* ==========================================================
     AMBIENT CHIMES
     ========================================================== */
  const muteBtn = document.getElementById('muteBtn');
  let audioCtx = null, playing = false, master = null;
  function startChimes() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = [261.63, 329.63, 392, 523.25, 659.25];
    master = audioCtx.createGain(); master.gain.value = 0;
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(.04, audioCtx.currentTime + 2);
    (function chime() {
      if (!playing) return;
      const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[(Math.random() * notes.length) | 0] * (Math.random() < .3 ? 2 : 1);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(.4, audioCtx.currentTime + .06);
      g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + 3);
      osc.connect(g); g.connect(master);
      osc.start(); osc.stop(audioCtx.currentTime + 3.2);
      setTimeout(chime, 1200 + Math.random() * 2400);
    })();
  }
  if (muteBtn) muteBtn.addEventListener('click', () => {
    if (!playing) { playing = true; startChimes(); muteBtn.textContent = '🔊'; }
    else { playing = false; try { master && master.disconnect(); } catch(_){} muteBtn.textContent = '🔈'; }
  });
})();
