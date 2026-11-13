const SUPABASE_URL = 'https://vhixhgvgszgmjmhcdrtl.supabase.co'   // must end at .supabase.co
const SUPABASE_KEY = 'sb_publishable_ETapHIURDN3y3kD6rBmk5A_Km-ceKGj'               // publishable key only, never the secret key

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

async function loadEvents() {
  const { data, error } = await db
    .from('events')
    .select('id, title, description, location, starts_at, ends_at')
    .eq('cancelled', false)
    .order('starts_at')
  if (error) {
    console.error(error)
    return []
  }
  return data
}

function eventsOnDay(events, year, month, day) {
  return events.filter((e) => {
    const d = new Date(e.starts_at)
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  })
}

// when building a day cell:
eventsOnDay(allEvents, year, month, day).forEach((ev) => {
  const label = document.createElement('div')
  label.className = 'calendar-event'
  label.textContent = ev.title
  cell.appendChild(label)
})