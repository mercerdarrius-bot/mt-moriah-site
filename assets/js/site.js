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

  /* Hero video: Safari and low-power mode sometimes ignore the autoplay
     attribute, so nudge playback on load, tab focus, and first interaction. */
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo && !reduceMotion) {
    const nudge = () => heroVideo.play().catch(() => {});
    nudge();
    document.addEventListener('visibilitychange', nudge);
    window.addEventListener('pointerdown', nudge, { once: true });
  }

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
    visit: 'e99cf1d8-0596-4ae7-b5a8-eeda40faf6ff',
    serve: '3e0252b7-c751-4479-8d1f-b2d5492517a3'
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
