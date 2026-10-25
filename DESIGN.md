# Design

## Visual theme
Student Hub style (v2): a warm neutral paper ground, one green accent for primary actions and current state, flat surfaces with no shadows and no nested panels, on an 8px spacing grid. It is text only: no images, icons, logos, or symbols.

## Color (hex, defined on `:root` in `assets/styles.css`)
| Token | Value | Role |
|---|---|---|
| `--paper` | #FAF9F6 | Page background |
| `--paper-2` | #F1EFEA | Disclaimer panel, hovers, neutral tags |
| `--line` / `--line-strong` | #E4E2DC / #CBC8BF | Hairline rules, borders, outlined buttons |
| `--ink` | #18181B | Body text, list top rules, footer rule |
| `--ink-2` / `--ink-3` | #52525B / #6E6E76 | Secondary and faint text, uppercase labels |
| `--accent` | #1F5C46 | The one accent: primary button, current nav item, current period, "love" in the motto |
| `--accent-tint` | #E5EEE9 | "No school" tags and calendar days |
| `--warning` / `--warning-tint` | #85570A / #F5EDDA | Notice bar, "Exams" tags and calendar days |

Status colours are functional only, never decoration.

## Typography
- Family: Raleway (variable: wght 100–900), self-hosted in `assets/fonts/` under the OFL. Body sets `lining-nums` because Raleway defaults to old-style figures.
- Scale: xs 0.75rem, sm 0.875rem, base 1rem, lg 1.125rem, xl 1.5rem, 2xl clamp(2–2.5rem), 3xl clamp(3–5.5rem).
- Headings are 800 weight with tight tracking (-0.02em to -0.045em) and `text-wrap: balance`. Small headings over lists and panels are uppercase labels (xs, 700, 0.08em tracking, `--ink-3`).

## Components
- **Notice bar:** the first element on every page. Full-width `--warning-tint` with "Unofficial student website." in `--warning` and the unaffiliation sentence, linking to `#disclaimer`.
- **Header:** text wordmark `olqw.ca` (".ca" in `--ink-3`) and a text nav. The current page gets ink text and a 2px accent underline.
- **Hero (home):** a compact strip, not a full band. The school name (h1, xl) and location line sit on the left, and "Choose love always." sits on one line on the right ("love" in accent). On phones they stack.
- **Band (subpages):** an uppercase label kicker, an h1 (clamp 2.25–3.5rem) and a lede in `--ink-2`.
- **Sections:** separated by a 1px `--line` top rule.
- **Options list:** full-width rows under a 1px ink rule, a large title and a short note. Hover fills `--paper-2` and turns the title accent.
- **Buttons:** primary is filled accent with a 6px radius (one per view). Others are outlined with `--line-strong`. All are at least 44px tall.
- **Tags:** 4px radius, xs bold. Neutral (`--paper-2`), "No school" (accent tint) and "Exams" (warning tint).
- **Empty state:** a flat panel with a 1px border, a heading, a note and a primary button.
- **Calendar list:** dates grouped by month (h2), in an ordered list with hairline rows. On the left is the weekday (faint, small) above the date (bold). On the right is the name, then a tag.
- **School data (`assets/school-data.js`):** the one place for key dates, bell times and the Week 1/Week 2 anchor. The calendar and the home sidebar both read it.
- **Today panel (`assets/today.js`, home page):** a sidebar on ≥64rem and a panel above "Where to?" on phones.
  - A flat bordered panel runs on Toronto time. It shows the date, the clock, an accent uppercase kicker with the week, the current period or state as the title, the lunch line, time left, and a 4px accent progress bar.
  - Below it is the day's bell list in a `<details>`, open by default on computers and closed on phones; the choice survives re-renders. Rows are separated by hairlines. The current row is bold with an accent time, finished rows are faint, and the lunches sit under the long slot. On days off and after school it shows the next school day's schedule.
  - At the bottom (computers only) is a "Coming up" list with the next 4 dates.
  - The rotation skips weeks where every weekday is "off". `?now=YYYY-MM-DDTHH:MM` previews another moment.
- **Live calendar (`assets/calendar.js`):** reads `school-data.js`. It renders:
  - an "Up next" card (ink border) and a "Next day off" card (line border), each with a countdown
  - a month grid of day buttons: no-school days fill accent tint, exam days fill warning tint, and events get a 3px accent bar at the bottom. Today has an ink number circle, and the selected day has an ink border.
  - a selected-day panel
  - a "Coming up" list, with past events in a collapsed `<details>`
  - Arrow keys, Home/End and PageUp/PageDown move through the grid. Without JavaScript the static list shows. `?today=YYYY-MM-DD` previews another date.
- **Disclaimer panel:** a flat `--paper-2` panel with the verbatim disclaimer text.
- **Footer:** a 1px ink top rule, the motto, an unaffiliated note and a link row.

## Layout & motion
- Max width 75rem, with gutter clamp(1rem, 4vw, 1.5rem).
- On load the motto words rise 0.28em (ease-out-expo, staggered 90ms). Text is visible at every frame.
- Reduced motion makes all animations and transitions effectively instant.
