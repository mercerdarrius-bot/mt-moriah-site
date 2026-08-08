/* Homepage widgets: the events calendar, the auto-updating latest service
   label, and the Plan Your Visit form. */

(function () {
  'use strict';

  const U = window.MM_EVENT_UTILS;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ---------- Events calendar ---------- */

  const grid = document.getElementById('cal-grid');
  const monthLabel = document.getElementById('cal-month');
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');
  const upcomingList = document.getElementById('cal-upcoming');

  if (grid && monthLabel) {
    const upcoming = U.upcoming();
    const today = U.today();
    /* Open on the month holding the next event so the calendar is never empty
       on arrival, falling back to the current month when nothing is scheduled. */
    const anchor = upcoming.length ? U.parse(upcoming[0].date) : today;
    let viewYear = anchor.getFullYear();
    let viewMonth = anchor.getMonth();

    const byDay = {};
    window.MM_EVENTS.forEach(e => {
      const d = U.parse(e.date);
      byDay[d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate()] = e;
    });

    function render() {
      monthLabel.textContent = MONTHS[viewMonth] + ' ' + viewYear;
      grid.innerHTML = '';

      DOW.forEach(d => {
        const h = document.createElement('span');
        h.className = 'cal-dow';
        h.setAttribute('aria-hidden', 'true');
        h.textContent = d;
        grid.appendChild(h);
      });

      const first = new Date(viewYear, viewMonth, 1).getDay();
      const days = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (let i = 0; i < first; i++) {
        const pad = document.createElement('span');
        pad.className = 'cal-pad';
        grid.appendChild(pad);
      }

      for (let day = 1; day <= days; day++) {
        const key = viewYear + '-' + viewMonth + '-' + day;
        const ev = byDay[key];
        const cellDate = new Date(viewYear, viewMonth, day, 12, 0, 0);
        const isToday = cellDate.getTime() === today.getTime();
        const isPast = cellDate < today;

        let cell;
        if (ev) {
          cell = document.createElement('a');
          cell.href = 'events.html#' + ev.slug;
          cell.className = 'cal-day cal-day--event';
          cell.setAttribute('aria-label', day + ' ' + MONTHS[viewMonth] + ', ' + ev.title);
          if (isPast) cell.classList.add('is-past');
        } else {
          cell = document.createElement('span');
          cell.className = 'cal-day';
        }
        if (isToday) cell.classList.add('is-today');

        const n = document.createElement('span');
        n.className = 'cal-num';
        n.textContent = day;
        cell.appendChild(n);

        if (ev) {
          const dot = document.createElement('span');
          dot.className = 'cal-dot';
          dot.setAttribute('aria-hidden', 'true');
          cell.appendChild(dot);
          const tip = document.createElement('span');
          tip.className = 'cal-tip';
          tip.textContent = ev.title;
          cell.appendChild(tip);
        }
        grid.appendChild(cell);
      }
    }

    function shift(delta) {
      viewMonth += delta;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => shift(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => shift(1));
    render();

    if (upcomingList) {
      const next = upcoming.slice(0, 3);
      if (!next.length) {
        upcomingList.innerHTML = '<p class="cal-empty">No events are on the calendar right now. Join us Sunday for worship at 11:00 AM.</p>';
      } else {
        next.forEach(e => {
          const d = U.parse(e.date);
          const a = document.createElement('a');
          a.className = 'up-item';
          a.href = 'events.html#' + e.slug;
          a.innerHTML =
            '<span class="up-date"><span class="up-mon">' + MONTHS[d.getMonth()].slice(0, 3) +
            '</span><span class="up-day">' + d.getDate() + '</span></span>' +
            '<span class="up-text"><span class="up-title"></span>' +
            '<span class="up-meta"></span></span>' +
            '<span class="up-arrow" aria-hidden="true">&rarr;</span>';
          a.querySelector('.up-title').textContent = e.title;
          a.querySelector('.up-meta').textContent = e.ministry + ' · ' + e.timeLabel;
          upcomingList.appendChild(a);
        });
      }
    }
  }

  /* ---------- Latest service label ---------- */

  const sermonDate = document.getElementById('sermon-date');
  if (sermonDate) {
    const n = new Date();
    const sunday = new Date(n.getFullYear(), n.getMonth(), n.getDate() - n.getDay());
    sermonDate.textContent = MONTHS[sunday.getMonth()] + ' ' + sunday.getDate() + ', ' + sunday.getFullYear();
  }

  /* ---------- Plan Your Visit form ---------- */

  const visitForm = document.getElementById('visit-form');
  if (visitForm && window.mmWireForm) {
    /* A live calendar rather than a hardcoded list of dates, so nothing here
       ever needs updating. Sundays and Tuesdays are outlined as service days,
       and past dates cannot be chosen. */
    const dpGrid = document.getElementById('dp-grid');
    const dpMonth = document.getElementById('dp-month');
    const dpPrev = document.getElementById('dp-prev');
    const dpNext = document.getElementById('dp-next');
    const dpSelected = document.getElementById('dp-selected');
    const dpClear = document.getElementById('dp-clear');
    const visitingInput = document.getElementById('vf-visiting');
    const SERVICE_DAYS = [0, 2];
    const HINT = 'Outlined days are service days. Pick one, or leave this blank.';

    if (dpGrid && visitingInput) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let vYear = today.getFullYear();
      let vMonth = today.getMonth();
      let chosen = null;

      function label(d) {
        return DOW_FULL[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
      }

      function renderPicker() {
        dpMonth.textContent = MONTHS[vMonth] + ' ' + vYear;
        dpPrev.disabled = (vYear === today.getFullYear() && vMonth === today.getMonth());
        dpGrid.innerHTML = '';

        DOW.forEach(d => {
          const h = document.createElement('span');
          h.className = 'dp-dow';
          h.setAttribute('aria-hidden', 'true');
          h.textContent = d.charAt(0);
          dpGrid.appendChild(h);
        });

        const first = new Date(vYear, vMonth, 1).getDay();
        const days = new Date(vYear, vMonth + 1, 0).getDate();
        for (let i = 0; i < first; i++) {
          const pad = document.createElement('span');
          pad.className = 'dp-pad';
          dpGrid.appendChild(pad);
        }

        for (let day = 1; day <= days; day++) {
          const d = new Date(vYear, vMonth, day);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'dp-day';
          btn.textContent = day;
          btn.setAttribute('aria-label', label(d));
          if (d < today) {
            btn.disabled = true;
          } else {
            if (SERVICE_DAYS.indexOf(d.getDay()) !== -1) btn.classList.add('is-service');
            if (chosen && d.getTime() === chosen.getTime()) {
              btn.classList.add('is-selected');
              btn.setAttribute('aria-pressed', 'true');
            } else {
              btn.setAttribute('aria-pressed', 'false');
            }
            btn.addEventListener('click', () => {
              chosen = d;
              visitingInput.value = label(d);
              dpSelected.innerHTML = 'Visiting <strong></strong>';
              dpSelected.querySelector('strong').textContent = label(d);
              dpClear.hidden = false;
              renderPicker();
            });
          }
          dpGrid.appendChild(btn);
        }
      }

      function shiftMonth(delta) {
        vMonth += delta;
        if (vMonth < 0) { vMonth = 11; vYear--; }
        if (vMonth > 11) { vMonth = 0; vYear++; }
        renderPicker();
      }

      dpPrev.addEventListener('click', () => shiftMonth(-1));
      dpNext.addEventListener('click', () => shiftMonth(1));
      dpClear.addEventListener('click', () => {
        chosen = null;
        visitingInput.value = 'Still deciding';
        dpSelected.textContent = HINT;
        dpClear.hidden = true;
        renderPicker();
      });
      renderPicker();
    }

    window.mmWireForm({
      form: visitForm,
      accessKey: window.MM_FORM_KEYS.visit,
      errorEl: document.getElementById('visit-error'),
      subject: d => 'Plan Your Visit: ' + d.name,
      onSuccess: () => {
        document.getElementById('visit-form-wrap').hidden = true;
        const done = document.getElementById('visit-success');
        done.hidden = false;
        done.setAttribute('tabindex', '-1');
        done.focus();
      }
    });
  }
})();
