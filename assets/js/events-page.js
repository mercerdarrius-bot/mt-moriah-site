/* Renders the events page from assets/js/events-data.js so adding an event
   only means editing that one file. Upcoming events render in date order and
   anything past moves itself into the archive section below. */

(function () {
  'use strict';

  const U = window.MM_EVENT_UTILS;
  const upcomingWrap = document.getElementById('events-upcoming');
  const pastWrap = document.getElementById('events-past');
  const pastSection = document.getElementById('past-section');
  if (!upcomingWrap) return;

  function gcalUrl(e) {
    const d = U.parse(e.date);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12);
    const fmt = x => String(x.getFullYear()) +
      String(x.getMonth() + 1).padStart(2, '0') +
      String(x.getDate()).padStart(2, '0');
    const details = [e.tagline, e.timeLabel].filter(Boolean).join('. ');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(e.title) +
      '&dates=' + fmt(d) + '/' + fmt(end) +
      '&details=' + encodeURIComponent(details) +
      '&location=' + encodeURIComponent(e.venue + ', ' + e.address);
  }

  function pin(label, value) {
    const row = document.createElement('div');
    row.className = 'ev-meta-row';
    const l = document.createElement('span');
    l.className = 'ev-meta-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'ev-meta-value';
    v.textContent = value;
    row.append(l, v);
    return row;
  }

  function card(e, isPast) {
    const art = document.createElement('article');
    art.className = 'ev-card' + (isPast ? ' ev-card--past' : '');
    art.id = e.slug;
    art.setAttribute('data-reveal', '');

    const media = document.createElement('div');
    media.className = 'ev-media';
    const img = document.createElement('img');
    img.src = e.flyer;
    img.alt = e.title + ' flyer';
    img.loading = 'lazy';
    /* Intrinsic size reserves the flyer's space before it loads, so nothing
       below it jumps once the image arrives. */
    if (e.flyerSize) {
      img.width = e.flyerSize[0];
      img.height = e.flyerSize[1];
    }
    media.appendChild(img);

    const body = document.createElement('div');
    body.className = 'ev-body';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.innerHTML = '<span class="tick" aria-hidden="true"></span>';
    eyebrow.append(document.createTextNode(e.ministry));
    body.appendChild(eyebrow);

    if (e.status) {
      const flag = document.createElement('p');
      flag.className = 'ev-status';
      flag.textContent = e.status;
      body.appendChild(flag);
      art.classList.add('ev-card--flagged');
    }

    const h = document.createElement('h3');
    h.className = 'ev-title';
    h.textContent = e.title;
    body.appendChild(h);

    if (e.tagline) {
      const t = document.createElement('p');
      t.className = 'ev-tagline';
      t.textContent = e.tagline;
      body.appendChild(t);
    }

    const meta = document.createElement('div');
    meta.className = 'ev-meta';
    meta.appendChild(pin('When', e.dateLabel));
    meta.appendChild(pin('Time', e.timeLabel));
    meta.appendChild(pin('Where', e.venue));
    meta.appendChild(pin('Address', e.address));
    body.appendChild(meta);

    (e.body || []).forEach(p => {
      const el = document.createElement('p');
      el.className = 'ev-text';
      el.textContent = p;
      body.appendChild(el);
    });

    if (e.scripture) {
      const q = document.createElement('blockquote');
      q.className = 'ev-scripture';
      const line = document.createElement('p');
      line.textContent = e.scripture.text;
      const cite = document.createElement('cite');
      cite.textContent = e.scripture.ref;
      q.append(line, cite);
      body.appendChild(q);
    }

    if (e.details && e.details.length) {
      const dl = document.createElement('ul');
      dl.className = 'ev-details';
      e.details.forEach(d => {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = d.label;
        li.append(strong, document.createTextNode(d.value));
        dl.appendChild(li);
      });
      body.appendChild(dl);
    }

    if (!isPast) {
      const actions = document.createElement('div');
      actions.className = 'ev-actions';

      /* A postponed event has no firm date yet, so only directions are offered */
      const cal = document.createElement('a');
      cal.className = 'btn btn-red';
      cal.href = gcalUrl(e);
      cal.target = '_blank';
      cal.rel = 'noopener';
      cal.textContent = 'Add to Calendar';

      const map = document.createElement('a');
      map.className = 'btn btn-outline';
      map.href = 'https://maps.google.com/?q=' + encodeURIComponent(e.venue + ', ' + e.address);
      map.target = '_blank';
      map.rel = 'noopener';
      map.textContent = 'Get Directions';

      if (e.status) { actions.append(map); } else { actions.append(cal, map); }
      body.appendChild(actions);
    }

    art.append(media, body);
    return art;
  }

  const upcoming = U.upcoming();
  const past = U.past();

  if (!upcoming.length) {
    const empty = document.createElement('p');
    empty.className = 'ev-empty';
    empty.textContent = 'There are no events on the calendar right now. Join us for worship every Sunday at 11:00 AM, and check back soon.';
    upcomingWrap.appendChild(empty);
  } else {
    upcoming.forEach(e => upcomingWrap.appendChild(card(e, false)));
  }

  if (past.length && pastWrap) {
    past.forEach(e => pastWrap.appendChild(card(e, true)));
  } else if (pastSection) {
    pastSection.hidden = true;
  }

  /* The cards are built after site.js wired its observer, so reveal them here. */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fresh = document.querySelectorAll('.ev-card[data-reveal]');
  if (!reduce && !document.documentElement.classList.contains('noanim') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-revealed'); io.unobserve(en.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    fresh.forEach(el => io.observe(el));
  } else {
    fresh.forEach(el => el.classList.add('is-revealed'));
  }

  /* Honor a deep link like events.html#pool-party now that the cards exist.
     The jump is instant rather than smooth so it cannot be interrupted, and it
     repeats once every flyer has loaded because lazy images change the offsets
     underneath the first attempt. */
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.classList.add('is-revealed');
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      /* Retry briefly instead of jumping once: flyers load lazily and the
         browser may restore its own scroll position after we land, so keep
         nudging until the card is actually at the top. */
      let tries = 0;
      const settle = setInterval(() => {
        const top = target.getBoundingClientRect().top;
        if (Math.abs(top) < 8 || tries++ > 12) { clearInterval(settle); return; }
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, 60);
    }
  }
})();
