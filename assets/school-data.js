// School data for olqw.ca. This is the one place to edit dates and bell times.
// Used by the calendar page (calendar.js) and the home page sidebar (today.js).
window.OLQW = {
  // Week rotation. The week starting on this Monday is the given week, and it
  // alternates every week after (and before) that. A week where every weekday
  // is a "No school" day (winter break, March break, summer) is skipped, so
  // the rotation pauses instead of flipping.
  weekAnchor: { monday: "2026-10-26", week: 2 },

  // Bell schedule (24-hour times, Toronto time). A `name` given as
  // { 1: ..., 2: ... } changes with the week: Week 2 swaps periods 3 and 4.
  bells: [
    { start: "08:15", end: "08:20", name: "Warning bell", kind: "warning" },
    { start: "08:20", end: "09:34", name: "Period 1" },
    { start: "09:40", end: "10:53", name: "Period 2" },
    {
      start: "10:59",
      end: "12:59",
      name: { 1: "Period 3", 2: "Period 4" },
      lunches: [
        { name: "Lunch A", start: "10:59", end: "11:39" },
        { name: "Lunch B", start: "11:39", end: "12:19" },
        { name: "Lunch C", start: "12:19", end: "12:59" },
      ],
    },
    { start: "13:05", end: "14:18", name: { 1: "Period 4", 2: "Period 3" } },
  ],

  // Key dates: [start, end or null, name, type]
  // type: "off" (No school), "exam" (Exams), "event" (Event), or null (no label)
  events: [
    ["2026-10-29", null, "Awards Night", "event"],
    ["2026-11-04", null, "Post-secondary fair", "event"],
    ["2026-11-05", null, "Grade 8 parent open house", "event"],
    ["2026-11-20", null, "PA day", "off"],
    ["2026-12-21", "2027-01-01", "Winter break", "off"],
    ["2027-01-26", "2027-02-01", "Semester 1 exams", "exam"],
    ["2027-02-02", null, "PA day", "off"],
    ["2027-02-03", null, "Exam review", "exam"],
    ["2027-02-15", null, "Family Day", "off"],
    ["2027-03-15", "2027-03-19", "March break", "off"],
    ["2027-03-26", null, "Good Friday", "off"],
    ["2027-03-29", null, "Easter Monday", "off"],
    ["2027-05-24", null, "Victoria Day", "off"],
    ["2027-06-01", null, "Ontario Day", null],
    ["2027-06-21", "2027-06-25", "Semester 2 exams", "exam"],
    ["2027-06-28", null, "Exam review", "exam"],
    ["2027-06-29", "2027-06-30", "PA days", "off"],
    ["2027-07-01", null, "Summer break begins", "off"],
    ["2027-09-02", null, "PA day", "off"],
  ],

  // Days from this date on are summer break (until next year's dates are added).
  summerFrom: "2027-07-01",
};
