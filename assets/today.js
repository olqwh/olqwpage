// Home page sidebar: what's happening now, today's bell schedule, and what's
// coming up. Reads school-data.js and runs on Toronto time.
(() => {
  "use strict";

  const data = window.OLQW;
  const box = document.getElementById("today");
  if (!data || !box) return;

  // Dates

  const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const same = (a, b) => a.getTime() === b.getTime();
  const diff = (a, b) => Math.round((b - a) / 86400000);

  const fmt = (opts) => new Intl.DateTimeFormat("en-US", opts);
  const fmtLong = fmt({ weekday: "long", month: "long", day: "numeric" });
  const fmtShort = fmt({ weekday: "short", month: "short", day: "numeric" });
  const fmtWeekday = fmt({ weekday: "long" });

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

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

  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const bells = data.bells.map((b) => ({
    ...b,
    s: toMin(b.start),
    e: toMin(b.end),
    lunches: (b.lunches || []).map((l) => ({ ...l, s: toMin(l.start), e: toMin(l.end) })),
  }));
  const nameFor = (b, week) => (typeof b.name === "string" ? b.name : b.name[week] || b.name[1]);
  const firstClass = bells.find((b) => b.kind !== "warning");

  const summerFrom = data.summerFrom ? parse(data.summerFrom) : null;
  const anchor = parse(data.weekAnchor.monday);
  const anchorWeek = data.weekAnchor.week;

  // School days and the week rotation

  const eventsOn = (d) => events.filter((e) => d >= e.start && d <= e.end);
  const offEvent = (d) => eventsOn(d).find((e) => e.type === "off");
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const inSummer = (d) => summerFrom && d >= summerFrom;
  const isSchoolDay = (d) => !isWeekend(d) && !inSummer(d) && !offEvent(d);

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

  const nextSchoolDay = (d) => {
    for (let i = 1; i <= 120; i++) {
      const n = addDays(d, i);
      if (isSchoolDay(n)) return n;
    }
    return null;
  };

  // Clock: Toronto time. `?now=YYYY-MM-DDTHH:MM` previews another moment.

  const tz = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const override = (new URLSearchParams(location.search).get("now") || "").match(
    /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?$/
  );
  const clock = () => {
    if (override) return { day: parse(override[1]), mins: override[2] ? +override[2] * 60 + +override[3] : 9 * 60 };
    const p = Object.fromEntries(tz.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { day: new Date(+p.year, +p.month - 1, +p.day), mins: +p.hour * 60 + +p.minute + +p.second / 60 };
  };

  // Formatting

  const hm = (mins) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return [h % 12 || 12, String(m).padStart(2, "0"), h >= 12 ? "pm" : "am"];
  };
  const time = (mins) => {
    const [h, m, ap] = hm(mins);
    return `${h}:${m} ${ap}`;
  };
  const span = (s, e) => {
    const [h1, m1, a1] = hm(s);
    const [h2, m2, a2] = hm(e);
    return a1 === a2 ? `${h1}:${m1} to ${h2}:${m2} ${a2}` : `${h1}:${m1} ${a1} to ${h2}:${m2} ${a2}`;
  };
  const shortSpan = (s, e) => `${hm(s)[0]}:${hm(s)[1]} to ${hm(e)[0]}:${hm(e)[1]}`;
  const left = (n) => {
    n = Math.max(1, Math.ceil(n));
    if (n < 60) return `${n} min`;
    const h = Math.floor(n / 60);
    const m = n % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  };
  const relEvent = (e, today) => {
    if (e.start <= today && e.end >= today) {
      if (same(e.start, e.end)) return "Today";
      return same(e.end, today) ? "Ends today" : `On now, until ${fmtShort.format(e.end)}`;
    }
    const s = diff(today, e.start);
    if (s === 1) return "Tomorrow";
    if (s < 31) return `In ${s} days`;
    if (s < 70) return `In ${Math.round(s / 7)} weeks`;
    return `In ${Math.round(s / 30.44)} months`;
  };

  const tagHtml = (e) => (e.label ? `<span class="cal-tag cal-tag--${e.type}">${esc(e.label)}</span>` : "");

  // Render

  const render = () => {
    const { day, mins } = clock();
    const week = weekOf(day);
    const school = isSchoolDay(day);
    const exam = school && eventsOn(day).find((e) => e.type === "exam");

    let kicker = "";
    let title = "";
    let sub = "";
    let meta = "";
    let progress = null;
    let current = -1;
    let schedDay = day;
    let liveToday = school && !exam;

    const backOn = (next) => {
      if (!next) return "";
      const w = weekOf(next);
      return `Back ${diff(day, next) === 1 ? "tomorrow" : fmtShort.format(next)}${w ? ` · Week ${w}` : ""}`;
    };

    if (!school) {
      const off = offEvent(day);
      const next = nextSchoolDay(day);
      kicker = "No school today";
      title = inSummer(day) ? "Summer break" : off ? off.name : "Weekend";
      meta = backOn(next);
      schedDay = next;
    } else if (exam) {
      kicker = "Exams today";
      title = exam.name;
      meta = "The regular bell schedule doesn't apply. Check your exam schedule.";
      schedDay = null;
    } else {
      const idx = bells.findIndex((b) => mins >= b.s && mins < b.e);
      const last = bells[bells.length - 1];
      if (mins < bells[0].s) {
        kicker = "Before school";
        title = `${nameFor(firstClass, week)} at ${time(firstClass.s)}`;
        meta = `Starts in ${left(firstClass.s - mins)}`;
      } else if (idx >= 0) {
        const b = bells[idx];
        current = idx;
        if (b.kind === "warning") {
          const nb = bells[idx + 1];
          kicker = "Warning bell";
          title = `${nameFor(nb, week)} starts soon`;
          meta = `Starts at ${time(nb.s)}, in ${left(nb.s - mins)}`;
        } else {
          kicker = "Right now";
          title = nameFor(b, week);
          meta = `${span(b.s, b.e)} · ${left(b.e - mins)} left`;
          progress = (mins - b.s) / (b.e - b.s);
          const lunch = b.lunches.find((l) => mins >= l.s && mins < l.e);
          if (lunch) sub = `${lunch.name} until ${time(lunch.e)}`;
        }
      } else if (mins >= last.e) {
        const next = nextSchoolDay(day);
        kicker = "After school";
        title = "School's out";
        meta = backOn(next);
        schedDay = next;
        liveToday = false;
      } else {
        const nb = bells.find((b) => b.s > mins);
        kicker = "Passing time";
        title = `${nameFor(nb, week)} is next`;
        meta = `Starts at ${time(nb.s)}, in ${left(nb.s - mins)}`;
      }
    }

    // Schedule list
    let sched = "";
    if (schedDay) {
      const sw = weekOf(schedDay) || 1;
      const isToday = same(schedDay, day);
      const ahead = diff(day, schedDay);
      const heading = isToday
        ? "Today's schedule"
        : ahead === 1
          ? "Tomorrow's schedule"
          : ahead < 7
            ? `${fmtWeekday.format(schedDay)}'s schedule`
            : `Schedule for ${fmtShort.format(schedDay)}`;
      const rows = bells
        .map((b, i) => {
          const cls = ["bell"];
          if (b.kind === "warning") cls.push("bell--warning");
          if (isToday && liveToday) {
            if (i === current) cls.push("is-now");
            else if (mins >= b.e) cls.push("is-done");
          }
          const lunches = b.lunches.length
            ? `<ul class="lunches">${b.lunches
                .map((l) => {
                  const now = isToday && liveToday && mins >= l.s && mins < l.e;
                  const done = isToday && liveToday && mins >= l.e;
                  return `<li class="${now ? "is-now" : done ? "is-done" : ""}"><span>${esc(l.name)}</span><span>${shortSpan(l.s, l.e)}</span></li>`;
                })
                .join("")}</ul>`
            : "";
          return `<li class="${cls.join(" ")}"${i === current && liveToday ? ' aria-current="time"' : ""}><span class="bell-time">${shortSpan(b.s, b.e)}</span><span class="bell-name">${esc(nameFor(b, sw))}</span>${lunches}</li>`;
        })
        .join("");
      sched = `
        <div class="today-sched">
          <div class="sched-head">
            <h3>${esc(heading)}</h3>
            <span class="week-pill">Week ${sw}</span>
          </div>
          <ol class="bells">${rows}</ol>
        </div>`;
    }

    // Coming up
    const upcoming = events.filter((e) => e.end >= day).slice(0, 4);
    const up = upcoming.length
      ? `<ol class="up-list">${upcoming
          .map(
            (e) => `<li>
              <span class="up-when">${esc(relEvent(e, day))}</span>
              <span class="up-name">${esc(e.name)}${tagHtml(e)}</span>
              <span class="up-date">${esc(same(e.start, e.end) ? fmtShort.format(e.start) : `${fmtShort.format(e.start)} to ${fmtShort.format(e.end)}`)}</span>
            </li>`
          )
          .join("")}</ol>`
      : `<p class="up-none">No more dates this school year.</p>`;

    const pct = progress == null ? null : Math.min(1, Math.max(0, progress));
    box.innerHTML = `
      <h2 class="visually-hidden">Today at OLQW</h2>
      <div class="today-card">
        <div class="today-top">
          <div class="today-row">
            <p>${fmtLong.format(day)}</p>
            <p class="today-clock">${time(mins)}</p>
          </div>
          <p class="today-kicker">${esc(kicker)}${week && school ? ` · Week ${week}` : ""}</p>
          <p class="today-title">${esc(title)}</p>
          ${sub ? `<p class="today-sub">${esc(sub)}</p>` : ""}
          ${meta ? `<p class="today-meta">${esc(meta)}</p>` : ""}
          ${
            pct == null
              ? ""
              : `<div class="today-bar" role="progressbar" aria-label="${esc(title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"><span style="transform: scaleX(${pct.toFixed(4)})"></span></div>`
          }
        </div>
        ${sched}
      </div>
      <div class="today-up">
        <h3>Coming up</h3>
        ${up}
        <a class="up-more" href="calendar.html">See the full calendar</a>
      </div>`;
  };

  render();
  box.hidden = false;
  if (!override) {
    setInterval(render, 15000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) render();
    });
  }
})();
