/* Builds the sermon archive grid. Each card starts as a thumbnail so the page
   stays fast, then swaps in a player on click so services can be watched right
   here without leaving the site. */

(function () {
  'use strict';

  const grid = document.getElementById('sermon-grid');
  if (!grid || !window.MM_SERMONS) return;

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function postedLabel(ymd) {
    const p = ymd.split('-').map(Number);
    return MONTHS[p[1] - 1] + ' ' + p[2] + ', ' + p[0];
  }

  function play(card, sermon) {
    if (card.dataset.playing === 'true') return;
    card.dataset.playing = 'true';
    const media = card.querySelector('.sc-media');
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + sermon.id +
      '?autoplay=1&rel=0';
    frame.title = sermon.title;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    media.innerHTML = '';
    media.appendChild(frame);
  }

  window.MM_SERMONS.forEach((s, i) => {
    const card = document.createElement('article');
    card.className = 'sermon-card';
    card.setAttribute('data-reveal', '');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sc-media';
    btn.setAttribute('aria-label', 'Play ' + s.title);

    const thumb = document.createElement('img');
    thumb.src = 'https://i.ytimg.com/vi/' + s.id + '/hqdefault.jpg';
    thumb.alt = '';
    thumb.width = 480;
    thumb.height = 360;
    if (i > 2) thumb.loading = 'lazy';

    const play_icon = document.createElement('span');
    play_icon.className = 'sc-play';
    play_icon.setAttribute('aria-hidden', 'true');
    play_icon.innerHTML = '<svg width="16" height="19" viewBox="0 0 16 19" fill="none"><path d="M0 1.7C0 .4 1.4-.4 2.5.3l12.8 7.6a1.7 1.7 0 0 1 0 2.9L2.5 18.4C1.4 19.1 0 18.3 0 17V1.7Z" fill="currentColor"/></svg>';

    btn.append(thumb, play_icon);

    const body = document.createElement('div');
    body.className = 'sc-body';
    const h = document.createElement('h3');
    h.className = 'sc-title';
    h.textContent = s.title;
    const meta = document.createElement('p');
    meta.className = 'sc-meta';
    meta.textContent = 'Posted ' + postedLabel(s.published);
    body.append(h, meta);

    card.append(btn, body);
    btn.addEventListener('click', () => play(card, s));
    grid.appendChild(card);
  });

  /* The cards are created after site.js set up its observer, so reveal them. */
  const cards = grid.querySelectorAll('[data-reveal]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && !document.documentElement.classList.contains('noanim') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    cards.forEach(el => io.observe(el));
  } else {
    cards.forEach(el => el.classList.add('is-revealed'));
  }
})();
