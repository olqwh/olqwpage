# Design

## Visual theme
"Clear spring sky over the schoolyard at recess." A light theme on pure white, with a committed sky band at the top of every page. It is text only: no images, icons, logos, or symbols.

## Color (OKLCH, defined on `:root` in `assets/styles.css`)
| Token | Value | Role |
|---|---|---|
| `--bg` | oklch(1 0 0) | Page background |
| `--surface` | oklch(0.965 0.012 205) | Disclaimer panel, hovers |
| `--line` | oklch(0.86 0.02 215) | Hairline rules, borders |
| `--ink` | oklch(0.24 0.03 230) | Body text (16:1 on bg) |
| `--muted` | oklch(0.5 0.025 225) | Secondary text (≥5.8:1 on bg) |
| `--sky` | oklch(0.53 0.125 214) | Primary. Hero and title bands; white text on it (≈4.9:1) |
| `--sky-deep` | oklch(0.36 0.07 220) | Links, focus ring |
| `--sky-soft` | oklch(0.93 0.04 205) | Option-row hover sweep, header tag |
| `--sun` | oklch(0.86 0.15 80) | Marigold highlight under "love" in the motto only |

Strategy: Committed. Sky carries the top band of each page, and everything else is white and ink.

## Typography
- Family: Bricolage Grotesque (variable: wght 200–800, opsz 12–96), self-hosted in `assets/fonts/` under the OFL. Optical sizing is automatic, so display sizes get the quirky cut and body text gets the readable one.
- Scale: sm 0.875rem, base 1.0625rem, lg 1.3125rem, xl clamp(1.5–2.5rem), 2xl clamp(2.25–4rem), motto clamp(3.25–5.5rem).
- Headings use 700–800 weight, negative tracking (≥ -0.035em), and `text-wrap: balance`.

## Components
- **Notice bar:** the first element on every page. Full-width `--sun` (marigold) with ink text (9:1): "Unofficial student website." and the unaffiliation sentence, linking to `#disclaimer`.
- **Header:** text wordmark `olqw.ca` and a pill nav (the current page is filled with ink).
- **Hero (home):** sky band with the school name, location and board line, and the stacked motto. On ≥60rem the motto sits bottom right.
- **Options list:** full-width rows with hairline dividers, a large title and a short note. On hover/focus a sky-soft fill sweeps in using `clip-path`.
- **Band (subpages):** sky title band with a kicker, h1 and lede.
- **Empty state:** dashed-border box with a heading, a note and an ink pill button.
- **Calendar:** dates grouped by month (h2), in an ordered list with hairline rows. On the left is the weekday (muted, small) above the date (bold). On the right is the name, then a text pill: "No school" (sky-soft), "Exams" (`--sun-soft` oklch(0.95 0.05 85)), or "Event" (outline).
- **School data (`assets/school-data.js`):** the one place for key dates, bell times and the Week 1/Week 2 anchor. The calendar and the home sidebar both read it.
- **Today sidebar (`assets/today.js`, home page, ≥64rem only):**
  - An ink "now" block runs on Toronto time. It shows the date, the clock, a sun-coloured kicker with the week, the current period or state as the title, the lunch line, time left, and a sun progress bar.
  - Below it is the day's bell list. The current row is sky-soft, finished rows are muted, and the lunches sit under the long slot. On days off and after school it shows the next school day's schedule.
  - At the bottom is a "Coming up" list with the next 4 dates.
  - The rotation skips weeks where every weekday is "off". `?now=YYYY-MM-DDTHH:MM` previews another moment.
- **Live calendar (`assets/calendar.js`):** reads `school-data.js`. It renders:
  - an "Up next" card (ink) and a "Next day off" card (outline), each with a countdown
  - a month grid of day buttons: no-school days fill sky-soft, exam days fill sun-soft, and events get a 4px sky bar at the bottom. Today has an ink number circle, and the selected day has an ink border.
  - a selected-day panel
  - a "Coming up" list, with past events in a collapsed `<details>`
  - Arrow keys, Home/End and PageUp/PageDown move through the grid. Without JavaScript the static list shows. `?today=YYYY-MM-DD` previews another date.
- **Disclaimer panel:** surface panel with a full 1px border and the verbatim disclaimer text.
- **Footer:** the motto, an unaffiliated note and a link row.

## Layout & motion
- Max width 72rem, with gutter clamp(1rem, 4vw, 2.5rem).
- On load the motto words rise 0.28em (ease-out-expo, staggered 90ms) and the sun highlight swipes in. Text is visible at every frame.
- Reduced motion makes all animations and transitions effectively instant.
