// generated using claude.ai

// events.js - dynamic calendar 
//
// Expected HTML in events.html (IDs used below):
//   <div id="calendar-container">
//     <div class="calendar-header">
//       <button id="prev-month">&lt;</button>
//       <h2 id="month-year"></h2>
//       <button id="next-month">&gt;</button>
//     </div>
//     <div id="calendar-grid"></div>
//   </div>
//   <script src="events.js"></script>

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthYearEl = document.getElementById("month-year");
const gridEl = document.getElementById("calendar-grid");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");

// Start on the current month. Remember: JS months are 0-11 (January = 0).

const today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Fallback test events, used if events.json can't be loaded.
// Dates are "YYYY-MM-DD".

let events = [
  { date: "2026-11-15", title: "Intro to Python Workshop" },
  { date: "2026-11-20", title: "General Body Meeting" },
];

// Build a "YYYY-MM-DD" string for a given day so it can match event dates.

function toDateString(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function renderCalendar(month, year) {
  gridEl.innerHTML = "";
  monthYearEl.textContent = `${MONTH_NAMES[month]} ${year}`;

  // Weekday header row (Sun ... Sat)
  
  DAY_NAMES.forEach((name) => {
    const header = document.createElement("div");
    header.className = "calendar-day-name";
    header.textContent = name;
    gridEl.appendChild(header);
  });

  // 0 = Sunday ... 6 = Saturday
  const firstDay = new Date(year, month, 1).getDay();
  // Day 0 of next month = last day of this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Empty cells before the 1st so it lands on the right weekday
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell empty";
    gridEl.appendChild(empty);
  }

  // One cell per day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = day;
    cell.appendChild(number);

    // Highlight today
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    // Add any events that fall on this day
    const dateStr = toDateString(year, month, day);
    events
      .filter((ev) => ev.date === dateStr)
      .forEach((ev) => {
        const eventEl = document.createElement("div");
        eventEl.className = "calendar-event";
        eventEl.textContent = ev.title;
        cell.appendChild(eventEl);
      });

    gridEl.appendChild(cell);
  }
}

function goToPreviousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar(currentMonth, currentYear);
}

function goToNextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar(currentMonth, currentYear);
}

prevBtn.addEventListener("click", goToPreviousMonth);
nextBtn.addEventListener("click", goToNextMonth);

// Phase 2: try to load events from events.json, then re-render.
// If the file is missing (or you open the page with file://), the
// fallback events above are used instead.

async function loadEvents() {
  try {
    const { data, error } = await db
      .from("events")
      .select("id, title, starts_at")
      .eq("cancelled", false)
      .order("starts_at");
    if (error) throw error;

    // Convert each database row into the { date, title } shape the calendar uses
    events = data.map((e) => {
      const d = new Date(e.starts_at);
      return {
        date: toDateString(d.getFullYear(), d.getMonth(), d.getDate()),
        title: e.title,
      };
    });
  } catch (err) {
    console.warn("Using built-in test events:", err.message);
  }
  renderCalendar(currentMonth, currentYear);
}

// Draw immediately, then refresh once events have loaded.
renderCalendar(currentMonth, currentYear);
loadEvents();

// Phase 3 (later): swap loadEvents() to pull from Supabase, e.g.
//   const { data, error } = await supabase.from("events").select("*");
//   if (!error) events = data;   // make sure columns are named date + title