(function () {
  const stage = document.querySelector('[data-carousel]');
  if (!stage) return;

  const win    = stage.querySelector('.media-window');
  const track  = stage.querySelector('[data-track]');
  const slides = Array.from(track.children);
  const dotsWrap = document.querySelector('[data-dots]');
  let idx = 0;

  /* ─── Use scroll-snap — browser handles all sizing ─── */
  win.style.overflowX        = 'scroll';
  win.style.scrollSnapType   = 'x mandatory';
  win.style.scrollBehavior   = 'smooth';
  win.style.webkitOverflowScrolling = 'touch';
  /* hide scrollbar visually */
  win.style.cssText += ';scrollbar-width:none;-ms-overflow-style:none;';

  track.style.display  = 'flex';
  track.style.flexWrap = 'nowrap';
  track.style.width    = 'max-content';
  track.style.transform = 'none'; // disable transform approach

  slides.forEach(s => {
    s.style.width          = win.clientWidth + 'px';
    s.style.flexShrink     = '0';
    s.style.scrollSnapAlign = 'start';
  });

  /* recompute slide widths on resize */
  new ResizeObserver(() => {
    slides.forEach(s => s.style.width = win.clientWidth + 'px');
    goTo(idx, false);
  }).observe(win);

  /* ─── dots ─── */
  function updateDots() {
    if (!dotsWrap) return;
    Array.from(dotsWrap.children).forEach((d, i) =>
      d.classList.toggle('active', i === idx));
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Item ${i + 1}`);
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
  }

  /* ─── navigation ─── */
  function goTo(n, animate = true) {
    idx = ((n % slides.length) + slides.length) % slides.length;
    win.style.scrollBehavior = animate ? 'smooth' : 'auto';
    win.scrollLeft = win.clientWidth * idx;
    updateDots();
    slides.forEach((s, i) => {
      if (i !== idx) { const v = s.querySelector('video'); if (v) v.pause(); }
    });
  }

  stage.querySelector('[data-prev]')?.addEventListener('click', () => goTo(idx - 1));
  stage.querySelector('[data-next]')?.addEventListener('click', () => goTo(idx + 1));

  /* sync dot when user manually scrolls */
  let scrollTimer;
  win.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const newIdx = Math.round(win.scrollLeft / win.clientWidth);
      if (newIdx !== idx) { idx = newIdx; updateDots(); }
    }, 80);
  }, { passive: true });

  /* ─── touch swipe (backup) ─── */
  let tx = 0;
  win.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  win.addEventListener('touchend',   e => {
    const d = tx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) goTo(d > 0 ? idx + 1 : idx - 1);
  }, { passive: true });

  buildDots();
  /* init after layout */
  requestAnimationFrame(() => {
    slides.forEach(s => s.style.width = win.clientWidth + 'px');
    win.scrollLeft = 0;
  });
})();
