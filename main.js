(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 35mm grain: a handful of pre-rendered noise tiles, stepped at 12fps ---------- */
  const grain = document.querySelector('.print__grain');
  if (grain) {
    const ctx = grain.getContext('2d', { alpha: true });
    const TILE = 192;
    const FRAMES = 8;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Build noise tiles: soft, slightly clumpy grain rather than pure per-pixel static
    const tiles = [];
    for (let f = 0; f < FRAMES; f++) {
      const c = document.createElement('canvas');
      c.width = TILE;
      c.height = TILE;
      const tctx = c.getContext('2d');
      const img = tctx.createImageData(TILE, TILE);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        // sum of two uniforms → triangular distribution, closer to how film grain reads
        const v = ((Math.random() + Math.random()) * 0.5) * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      tctx.putImageData(img, 0, 0);
      tiles.push(c);
    }

    let w = 0, h = 0;
    const size = () => {
      const r = grain.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr));
      h = Math.max(1, Math.round(r.height * dpr));
      grain.width = w;
      grain.height = h;
    };

    let frame = 0;
    const draw = () => {
      const t = tiles[frame % FRAMES];
      // grain scale: slightly larger than 1 device px so it reads as film, not screen noise
      const s = TILE * 1.2;
      const ox = -Math.floor(Math.random() * s);
      const oy = -Math.floor(Math.random() * s);
      ctx.clearRect(0, 0, w, h);
      for (let y = oy; y < h; y += s) {
        for (let x = ox; x < w; x += s) {
          ctx.drawImage(t, x, y, s, s);
        }
      }
      frame++;
    };

    size();
    draw();

    if (!reduceMotion) {
      let last = 0;
      let running = true;
      const loop = (now) => {
        if (!running) return;
        if (now - last > 1000 / 12) {
          last = now;
          draw();
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

      // Only burn frames while the print is actually on screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          const visible = entries.some((e) => e.isIntersecting);
          if (visible && !running) { running = true; requestAnimationFrame(loop); }
          if (!visible) running = false;
        }).observe(grain);
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) running = false;
        else if (!running) { running = true; requestAnimationFrame(loop); }
      });
    }

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { size(); draw(); }, 120);
    });
  }

  /* ---------- Title: split "Tay Boy" so each letter can respond to the cursor ---------- */
  const letters = document.querySelector('[data-letters]');
  if (letters && finePointer) {
    const text = letters.textContent;
    letters.textContent = '';
    for (const ch of text) {
      const s = document.createElement('span');
      s.className = 'ch' + (ch === ' ' ? ' ch--space' : '');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.setAttribute('aria-hidden', 'true');
      letters.appendChild(s);
    }
  }

  /* ---------- Apps: live states on hover (or on scroll-in for touch) ---------- */
  const apps = document.querySelectorAll('.app');

  const goLive = (el) => el.classList.add('is-live');
  const goIdle = (el) => el.classList.remove('is-live');

  if (finePointer) {
    apps.forEach((el) => {
      el.addEventListener('pointerenter', () => goLive(el));
      el.addEventListener('pointerleave', () => goIdle(el));
    });
  } else if (!reduceMotion && 'IntersectionObserver' in window) {
    // On touch devices there's no hover, so each row goes live briefly as it scrolls into view
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || seen.has(e.target)) return;
        seen.add(e.target);
        goLive(e.target);
        setTimeout(() => goIdle(e.target), 2600);
      });
    }, { threshold: 0.6 });
    apps.forEach((el) => io.observe(el));
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
})();
