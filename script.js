/* ============================================================
   For Jojo 🌸  —  interactions (mobile-first)
   The game revolves around the bouquet: tap its flowers.
   ============================================================ */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.matchMedia('(max-width: 640px)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- petal canvas ---------- */
  const canvas = document.getElementById('petals');
  const ctx = canvas.getContext('2d');
  function resize() {
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * DPR;
    canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  const PALETTE = ['#ef6f97', '#ffb38a', '#ffd7e4', '#f4c15b', '#e26aa0', '#ffffff'];
  const petals = [];
  function makePetal(x, y, burst = false) {
    const size = 6 + Math.random() * 10;
    return {
      x: x ?? Math.random() * innerWidth,
      y: y ?? -20,
      size,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.06,
      vx: burst ? (Math.random() - 0.5) * 6 : (Math.random() - 0.5) * 0.8,
      vy: burst ? -Math.random() * 5 - 1 : 0.6 + Math.random() * 1.2,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      life: burst ? 120 : Infinity,
      gravity: burst ? 0.12 : 0,
    };
  }
  const AMBIENT = reduceMotion ? 0 : (isSmall ? 26 : Math.min(46, Math.round(innerWidth / 24)));
  for (let i = 0; i < AMBIENT; i++) petals.push(makePetal(Math.random() * innerWidth, Math.random() * innerHeight));

  // a soft, pointed flower petal (not a heart)
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life === Infinity ? 0.85 : Math.min(1, p.life / 60);
    const s = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.5);                 // tip
    ctx.quadraticCurveTo(s, 0, 0, s * 1.5);  // right lobe -> bottom tip
    ctx.quadraticCurveTo(-s, 0, 0, -s * 1.5);// left lobe -> back to tip
    ctx.fill();
    ctx.restore();
  }
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
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
  if (!reduceMotion) tick();

  function spawnBurst(x, y, count = 12) {
    if (reduceMotion) return;
    for (let i = 0; i < count; i++) petals.push(makePetal(x, y, true));
  }

  // floating flower emoji (used for the finale shower — flowers, no hearts)
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
    if (e.target.closest('button, a, .blossom')) return;
    spawnBurst(e.clientX, e.clientY, isSmall ? 5 : 7);
  });

  /* ============================================================
     Build the bouquet: roses, lilies, peonies
     ============================================================ */
  const PALETTES = {
    rose:  [['#ef6f97', '#c93c68'], ['#ff8fab', '#d94e7c'], ['#ffb38a', '#e8874a'],
            ['#f6c1d6', '#e07ba3'], ['#e24b74', '#a83057']],
    peony: [['#ffd0de', '#ff9bbd'], ['#ffb8cf', '#f26fa0'], ['#ffc9b0', '#ff9273'],
            ['#ffdce8', '#ff9fc6'], ['#ff9db8', '#e35e88']],
    lily:  [['#ffffff', '#ffc2d6'], ['#fff2f7', '#ffaecb'], ['#ffe9d6', '#ffb98f'],
            ['#f9e9ff', '#e2b6f0']],
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
    out += `<circle r="${2.4 * s}" fill="#ffe9a8"/>`;
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
    out += `<circle r="${3.2 * s}" fill="#f6d98a"/>`;
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

  /* ---- the bouquet game ---- */
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
    // happy bounce (Web Animations — composes with CSS, leaves opacity alone)
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
    // invisible hit-target so taps near the flower always register (mobile-friendly)
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

  /* ============================================================
     Finale — flower shower
     ============================================================ */
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

  /* ============================================================
     Gentle ambient chimes (off by default)
     ============================================================ */
  const muteBtn = document.getElementById('muteBtn');
  let audioCtx = null, playing = false, master = null;
  function startAmbient() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 587.33, 659.25, 783.99];
    master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2);
    (function chime() {
      if (!playing) return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[(Math.random() * notes.length) | 0] * (Math.random() < 0.5 ? 1 : 2);
      g.gain.setValueAtTime(0, audioCtx.currentTime);
      g.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.2);
      osc.connect(g); g.connect(master);
      osc.start(); osc.stop(audioCtx.currentTime + 2.3);
      setTimeout(chime, 900 + Math.random() * 1600);
    })();
  }
  if (muteBtn) muteBtn.addEventListener('click', () => {
    if (!playing) { playing = true; startAmbient(); muteBtn.textContent = '🔊'; }
    else { playing = false; try { master && master.disconnect(); } catch (_) {} muteBtn.textContent = '🔈'; }
  });
})();
