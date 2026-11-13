import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

type ClubEvent = {
  id: string
  title: string
  location: string | null
  starts_at: string
}

function App() {
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, location, starts_at')
        .order('starts_at')
      if (error) setError(error.message)
      else setEvents(data ?? [])
    }
    loadEvents()
  }, [])

  return (
    <div>
      <h1>GWC Events</h1>
      {error && <p>Error: {error}</p>}
      {events.length === 0 && !error && <p>No events yet.</p>}
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.title} - {new Date(e.starts_at).toLocaleString()}
            {e.location && ` @ ${e.location}`}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App