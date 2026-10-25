// Live calendar for calendar.html.
// Reads the dates from school-data.js, then builds the month grid, the
// "up next" cards, and the upcoming / past lists.
(() => {
  "use strict";

  const data = window.OLQW;
  const live = document.getElementById("cal-live");
  if (!data || !live) return;

  const DAY = 86400000;

  const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const addMonths = (d, n) => {
    const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
    return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
  };
  const diff = (a, b) => Math.round((b - a) / DAY);
  const same = (a, b) => a.getTime() === b.getTime();

  const fmt = (opts) => new Intl.DateTimeFormat("en-US", opts);
  const fmtShort = fmt({ weekday: "short", month: "short", day: "numeric" });
  const fmtLong = fmt({ weekday: "long", month: "long", day: "numeric" });
  const fmtMonth = fmt({ month: "long", year: "numeric" });
  const fmtMd = fmt({ month: "short", day: "numeric" });
  const fmtWd = fmt({ weekday: "short" });

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  // Data

  const LABELS = { off: "No school", exam: "Exams", event: "Event" };
  const events = data.events
    .map(([start, end, name, type]) => ({
      start: parse(start),
      end: parse(end || start),
      name,
      type: LABELS[type] ? type : "other",
      label: LABELS[type] || "",
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  if (!events.length) return;

  // `?today=YYYY-MM-DD` previews the page as of another date.
  const now = new Date();
  let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const override = new URLSearchParams(location.search).get("today");
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) today = parse(override);

  const first = events[0].start;
  const last = events.reduce((m, e) => (e.end > m ? e.end : m), events[0].end);
  const minDate = monthStart(first < today ? first : today);
  const maxDate = monthEnd(last > today ? last : today);
  const clamp = (d) => (d < minDate ? minDate : d > maxDate ? maxDate : d);

  // Multi-day events (breaks, exams) skip weekends; single-day events show on their date.
  const onDay = (d) =>
    events.filter(
      (e) => d >= e.start && d <= e.end && (same(e.start, e.end) || (d.getDay() !== 0 && d.getDay() !== 6))
    );
  const isPast = (e) => e.end < today;
  const isNow = (e) => e.start <= today && e.end >= today;

  // Week rotation (same rules as today.js): weeks with no school days are skipped.
  const summerFrom = data.summerFrom ? parse(data.summerFrom) : null;
  const anchor = parse(data.weekAnchor.monday);
  const anchorWeek = data.weekAnchor.week;
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const isSchoolDay = (d) =>
    !isWeekend(d) && !(summerFrom && d >= summerFrom) && !onDay(d).some((e) => e.type === "off");
  const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const weekCounts = (mon) => [0, 1, 2, 3, 4].some((i) => isSchoolDay(addDays(mon, i)));

  // Week 1 or 2 for the week containing `d`, or null when the whole week is off.
  const weekOf = (d) => {
    const mon = mondayOf(d);
    if (!weekCounts(mon)) return null;
    let n = 0;
    if (mon >= anchor) {
      for (let w = anchor; w < mon; w = addDays(w, 7)) if (weekCounts(w)) n++;
    } else {
      for (let w = mon; w < anchor; w = addDays(w, 7)) if (weekCounts(w)) n++;
    }
    return n % 2 === 0 ? anchorWeek : 3 - anchorWeek;
  };

  const rangeText = (e) =>
    same(e.start, e.end) ? fmtShort.format(e.start) : `${fmtShort.format(e.start)} to ${fmtShort.format(e.end)}`;

  const relDays = (n, future) => {
    if (n < 31) return future ? `In ${n} days` : `${n} days ago`;
    if (n < 70) {
      const w = Math.round(n / 7);
      return future ? `In ${w} weeks` : `${w} weeks ago`;
    }
    const m = Math.round(n / 30.44);
    return future ? `In ${m} months` : `${m} months ago`;
  };

  const relEvent = (e) => {
    if (isNow(e)) {
      if (same(e.start, e.end)) return "Today";
      return same(e.end, today) ? "Ends today" : `On now, until ${fmtShort.format(e.end)}`;
    }
    const s = diff(today, e.start);
    if (s === 1) return "Tomorrow";
    if (s > 1) return relDays(s, true);
    const ago = diff(e.end, today);
    return ago === 1 ? "Yesterday" : relDays(ago, false);
  };

  const relDate = (d) => {
    const n = diff(today, d);
    if (n === 0) return "Today";
    if (n === 1) return "Tomorrow";
    if (n === -1) return "Yesterday";
    return n > 0 ? relDays(n, true) : relDays(-n, false);
  };

  const tagHtml = (e) => (e.label ? `<span class="cal-tag cal-tag--${e.type}">${esc(e.label)}</span>` : "");

  // Up next

  const renderNext = () => {
    const box = document.getElementById("cal-next");
    const ahead = events.filter((e) => !isPast(e));
    if (!ahead.length) {
      box.innerHTML = `<div class="next-card next-card--lead"><p class="next-kicker">Up next</p><p class="next-when">That's a wrap</p><p class="next-date">No more dates this school year.</p></div>`;
      return;
    }
    const lead = ahead[0];
    const off = ahead.find((e) => e.type === "off");
    const second = off && off !== lead ? ["Next day off", off] : ahead[1] ? ["After that", ahead[1]] : null;

    const card = (kicker, e, cls) => `
        <div class="next-card ${cls}">
          <p class="next-kicker">${kicker}</p>
          <p class="next-when">${esc(relEvent(e))}</p>
          <p class="next-name">${esc(e.name)}</p>
          <p class="next-date"><span>${esc(rangeText(e))}</span>${tagHtml(e)}</p>
        </div>`;

    box.innerHTML = card("Up next", lead, "next-card--lead") + (second ? card(second[0], second[1], "") : "");
  };

  // Lists

  const listHtml = (list, withRel) => {
    const groups = new Map();
    for (const e of list) {
      const key = fmtMonth.format(e.start);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
    return [...groups]
      .map(
        ([month, items]) => `
        <section class="cal-month">
          <h3>${month}</h3>
          <ol class="cal-list">${items
            .map((e) => {
              const day = same(e.start, e.end)
                ? fmtWd.format(e.start)
                : `${fmtWd.format(e.start)} to ${fmtWd.format(e.end)}`;
              const date = same(e.start, e.end)
                ? `<time datetime="${iso(e.start)}">${fmtMd.format(e.start)}</time>`
                : `<time datetime="${iso(e.start)}">${fmtMd.format(e.start)}</time> to <time datetime="${iso(e.end)}">${fmtMd.format(e.end)}</time>`;
              const rel = withRel ? `<span class="cal-rel${isNow(e) ? " cal-rel--now" : ""}">${esc(relEvent(e))}</span>` : "";
              return `
            <li class="cal-item">
              <p class="cal-date"><span class="cal-day">${day}</span> ${date}${rel}</p>
              <p class="cal-what"><span class="cal-name">${esc(e.name)}</span>${tagHtml(e)}</p>
            </li>`;
            })
            .join("")}
          </ol>
        </section>`
      )
      .join("");
  };

  const renderLists = () => {
    const upcoming = events.filter((e) => !isPast(e));
    const past = events.filter(isPast);
    document.getElementById("cal-upcoming").innerHTML = upcoming.length
      ? listHtml(upcoming, true)
      : `<p class="cal-none">No more dates this school year.</p>`;
    const pastBox = document.getElementById("cal-past-wrap");
    pastBox.hidden = !past.length;
    document.getElementById("cal-past-count").textContent = `(${past.length})`;
    document.getElementById("cal-past").innerHTML = listHtml(past, true);
  };

  // Month grid

  const grid = document.getElementById("cal-grid");
  const title = document.getElementById("cal-month-title");
  const panel = document.getElementById("cal-day");
  const prevBtn = live.querySelector('[data-nav="prev"]');
  const nextBtn = live.querySelector('[data-nav="next"]');

  const state = { month: monthStart(clamp(today)), selected: clamp(today) };
  const typeOrder = ["off", "exam", "event", "other"];

  const renderPanel = () => {
    const d = state.selected;
    const list = onDay(d);
    const weekend = isWeekend(d);
    const week = isSchoolDay(d) && weekOf(d);
    panel.innerHTML = `
      <p class="day-rel">${esc(relDate(d))}${week ? ` · Week ${week}` : ""}</p>
      <h3 class="day-title">${fmtLong.format(d)}</h3>
      ${
        list.length
          ? `<ul class="day-events">${list
              .map(
                (e) => `<li>
              <span class="day-ev-name">${esc(e.name)}</span>${tagHtml(e)}
              ${same(e.start, e.end) ? "" : `<span class="day-ev-range">${esc(rangeText(e))}</span>`}
            </li>`
              )
              .join("")}</ul>`
          : `<p class="day-empty">${weekend ? "Weekend. " : ""}Nothing scheduled.</p>`
      }`;
  };

  const renderGrid = (swap) => {
    const m = state.month;
    title.textContent = fmtMonth.format(m);
    prevBtn.disabled = monthStart(m) <= minDate;
    nextBtn.disabled = monthEnd(m) >= maxDate;

    const lead = m.getDay();
    const days = monthEnd(m).getDate();
    let html = "";
    for (let i = 0; i < Math.ceil((lead + days) / 7) * 7; i++) {
      const n = i - lead + 1;
      if (i % 7 === 0) {
        // Week rail: the school week (Mon to Fri) sits in this Sunday-first row.
        const mon = new Date(m.getFullYear(), m.getMonth(), n + 1);
        const week = weekOf(mon);
        const current = same(addDays(today, -today.getDay()), addDays(mon, -1)) ? " is-current" : "";
        html += `<tr><th scope="row" class="wk${week ? ` wk--${week}${current}` : ""}">${
          week
            ? `<span class="wk-pill" aria-hidden="true">${week}</span><span class="visually-hidden">Week ${week}</span>`
            : `<span class="visually-hidden">No school this week</span>`
        }</th>`;
      }
      if (n < 1 || n > days) {
        html += `<td class="day-blank"></td>`;
      } else {
        const d = new Date(m.getFullYear(), m.getMonth(), n);
        const list = onDay(d);
        const types = new Set(list.map((e) => e.type));
        const fill = typeOrder.find((t) => types.has(t) && (t === "off" || t === "exam"));
        const cls = ["day"];
        if (fill) cls.push(`is-${fill}`);
        if (types.has("event") || types.has("other")) cls.push("has-event");
        if (d < today) cls.push("is-past");
        const isToday = same(d, today);
        if (isToday) cls.push("is-today");
        const sel = same(d, state.selected);

        const labels = list
          .filter((e) => same(d, e.start) || d.getDay() === 1 || n === 1)
          .map((e) => `<span class="day-label">${esc(e.name)}</span>`)
          .join("");
        const aria = [fmtLong.format(d), isToday ? "today" : "", ...list.map((e) => (e.label ? `${e.name}, ${e.label}` : e.name))]
          .filter(Boolean)
          .join(", ");

        html += `<td><button type="button" class="${cls.join(" ")}" data-date="${iso(d)}" aria-label="${esc(aria)}" aria-pressed="${sel}" tabindex="${sel ? 0 : -1}"${isToday ? ' aria-current="date"' : ""}><span class="day-num">${n}</span>${labels}</button></td>`;
      }
      if (i % 7 === 6) html += "</tr>";
    }
    grid.innerHTML = html;
    if (swap) {
      grid.classList.remove("swap-prev", "swap-next");
      void grid.offsetWidth;
      grid.classList.add(swap === -1 ? "swap-prev" : "swap-next");
    }
    renderPanel();
  };

  const focusSelected = () => grid.querySelector('button[tabindex="0"]')?.focus();

  const select = (d, focus) => {
    d = clamp(d);
    const dir = monthStart(d) - state.month;
    state.selected = d;
    state.month = monthStart(d);
    renderGrid(dir === 0 ? 0 : dir < 0 ? -1 : 1);
    if (focus) focusSelected();
  };

  // When switching months, land on the first dated day so the panel shows something useful.
  const goMonth = (m) => {
    m = monthStart(clamp(m));
    const inMonth = (d) => d >= m && d <= monthEnd(m);
    let pick = inMonth(today) ? today : null;
    if (!pick) {
      for (let d = m; d <= monthEnd(m); d = addDays(d, 1)) {
        if (onDay(d).length) {
          pick = d;
          break;
        }
      }
    }
    select(pick || m, false);
  };

  grid.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button.day");
    if (btn) select(parse(btn.dataset.date), true);
  });

  grid.addEventListener("keydown", (ev) => {
    const btn = ev.target.closest("button.day");
    if (!btn) return;
    const d = parse(btn.dataset.date);
    const moves = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -d.getDay()),
      End: () => addDays(d, 6 - d.getDay()),
      PageUp: () => addMonths(d, -1),
      PageDown: () => addMonths(d, 1),
    };
    if (!moves[ev.key]) return;
    ev.preventDefault();
    select(moves[ev.key](), true);
  });

  live.querySelector(".month-nav").addEventListener("click", (ev) => {
    const nav = ev.target.closest("[data-nav]")?.dataset.nav;
    if (nav === "prev") goMonth(addMonths(state.month, -1));
    else if (nav === "next") goMonth(addMonths(state.month, 1));
    else if (nav === "today") select(today, false);
  });

  // Calendar file (.ics), unlocked by the "unofficial" checkbox

  const icsForm = document.getElementById("ics-form");
  const icsAck = document.getElementById("ics-ack");
  const icsBtn = document.getElementById("ics-download");

  const icsDate = (d) => iso(d).replace(/-/g, "");
  const icsText = (s) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  // Lines over 75 characters continue on the next line after a space.
  const icsFold = (line) => line.match(/.{1,73}/g).join("\r\n ");

  const buildIcs = () => {
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//olqw.ca//School year calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:OLQW dates (unofficial)",
      "X-WR-TIMEZONE:America/Toronto",
    ];
    for (const e of events) {
      const slug = e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${icsDate(e.start)}-${slug}@olqw.ca`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${icsDate(e.start)}`,
        `DTEND;VALUE=DATE:${icsDate(addDays(e.end, 1))}`,
        `SUMMARY:${icsText(e.type === "off" ? `${e.name} (No school)` : e.name)}`,
        `DESCRIPTION:${icsText("Unofficial, from olqw.ca. Check important dates with the school.")}`,
        "TRANSP:TRANSPARENT",
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    return lines.map(icsFold).join("\r\n") + "\r\n";
  };

  icsAck.addEventListener("change", () => {
    icsBtn.disabled = !icsAck.checked;
  });

  icsForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!icsAck.checked) return;
    const url = URL.createObjectURL(new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "olqw-dates-unofficial.ics";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // The "Today" button's calendar icon shows today's date.
  live.querySelector(".today-num").textContent = today.getDate();

  // Go

  renderNext();
  renderLists();
  renderGrid(0);
  live.hidden = false;
  document.getElementById("cal-nojs")?.remove();
})();
