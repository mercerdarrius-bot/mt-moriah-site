/* Shared behavior for every page: scroll reveal, mobile nav, hero video, and
   the AJAX form helper used by the visit form and the serve-interest modal. */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (new URLSearchParams(location.search).has('noanim')) {
    document.documentElement.classList.add('noanim');
  }

  /* Scroll reveal */
  const revealables = document.querySelectorAll('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        io.unobserve(e.target);
      }
    }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('is-revealed'));
  }

  /* Hero video: it loads once the page has (the poster shows until then, as it
     always has), so a phone spends its first second on the page, not the
     video. Reduced motion never shows it, so never loads it. Safari and
     low-power mode sometimes ignore the autoplay attribute, so nudge playback
     on load, tab focus, and first interaction. */
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo && !reduceMotion) {
    const nudge = () => heroVideo.play().catch(() => {});
    const start = () => {
      heroVideo.querySelectorAll('source[data-src]').forEach(s => {
        s.src = s.getAttribute('data-src');
        s.removeAttribute('data-src');
      });
      heroVideo.load();
      nudge();
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    document.addEventListener('visibilitychange', nudge);
    window.addEventListener('pointerdown', nudge, { once: true });
  }

  /* Players further down load as they near the screen instead of with the
     page: each is in place well before it scrolls into view. */
  const whenNear = (el, fn) => {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { rootMargin: '800px 0px' });
    io.observe(el);
  };
  document.querySelectorAll('iframe[data-src]').forEach(frame => whenNear(frame, () => {
    frame.src = frame.getAttribute('data-src');
    frame.removeAttribute('data-src');
    // Merx Analytics counts sermon plays with its YouTube module, which the
    // tracker loads only for players already on the page at load. Load it here.
    if (!/enablejsapi=1/.test(frame.src)) return;
    if (window.__mxY) { if (window.__mxYReset) window.__mxYReset(); return; }
    window.__mxY = 1;
    const y = document.createElement('script');
    y.src = 'https://a.merxstudios.com/y.js';
    y.defer = true;
    document.head.appendChild(y);
  }));
  document.querySelectorAll('video[data-preload]').forEach(video => whenNear(video, () => {
    video.preload = video.getAttribute('data-preload');
    video.removeAttribute('data-preload');
  }));

  /* Mobile nav */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      menu.hidden = open;
      document.body.classList.toggle('menu-open', !open);
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      document.body.classList.remove('menu-open');
    }));
  }

  /* AJAX form helper. Submissions deliver through Web3Forms, and each form
     carries its own access key so the two can route to different inboxes.
     A key is bound to the address it was created for, so changing where a
     form delivers means minting a new key at web3forms.com for the new
     address and replacing that one value below. */
  window.MM_FORM_KEYS = {
    visit: '6f299fe4-ae58-4020-9e36-64f2b0b2c704',
    serve: 'a9ca769f-a502-4500-94d7-6796ebad1ab7'
  };

  window.mmWireForm = function (opts) {
    const form = opts.form;
    const submitBtn = form.querySelector('[type="submit"]');
    const errorEl = opts.errorEl;
    const label = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (errorEl) errorEl.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }
      const data = Object.fromEntries(new FormData(form).entries());
      data.access_key = opts.accessKey;
      data.subject = opts.subject(data);
      data.from_name = 'Mount Moriah Website';
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error('send failed');
        /* Merx Analytics counts the form once, only after it really sent
           (never what was written in it). */
        if (window.mx && opts.mxForm) window.mx('event', 'form_submit', { form: opts.mxForm });
        opts.onSuccess(data);
      } catch (err) {
        if (errorEl) errorEl.hidden = false;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = label;
        }
      }
    });
  };
})();
