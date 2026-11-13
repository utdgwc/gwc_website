import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './gwc-site/src/supabaseClient'

type ClubEvent = {
  id: string
  title: string
  starts_at: string
  checkin_opens_at: string | null
  checkin_closes_at: string | null
}

export default function CheckIn() {
  const [session, setSession] = useState<Session | null>(null)
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set())
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  // Keep track of whether someone is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) =>
      setSession(s)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  // Once logged in, load events and the ones this person already checked into
  useEffect(() => {
    if (!session) return
    const userId = session.user.id

    async function load() {
      const { data: evs } = await supabase
        .from('events')
        .select('id, title, starts_at, checkin_opens_at, checkin_closes_at')
        .eq('cancelled', false)
        .order('starts_at')
      setEvents(evs ?? [])

      const { data: mine } = await supabase
        .from('check_ins')
        .select('event_id')
        .eq('user_id', userId)
      setCheckedIn(new Set((mine ?? []).map((c) => c.event_id)))
    }
    load()
  }, [session])

  async function signUp() {
    setMessage(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setMessage(
      error
        ? error.message
        : 'Welcome to GWC! If email confirmation is on, check your inbox, then log in.'
    )
  }

  async function logIn() {
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
  }

  async function logOut() {
    await supabase.auth.signOut()
    setMessage(null)
  }

  async function checkIn(eventId: string) {
    if (!session) return
    setMessage(null)
    const { error } = await supabase
      .from('check_ins')
      .insert({ event_id: eventId, user_id: session.user.id })

    if (!error) {
      setCheckedIn((prev) => new Set(prev).add(eventId))
      setMessage("You're checked in!")
    } else if (error.code === '23505') {
      setMessage("You're already checked in to this event.")
    } else if (error.code === '42501') {
      setMessage("Check-in isn't open for this event right now.")
    } else {
      setMessage(error.message)
    }
  }

  // Only used to show/hide the button. The database enforces the real window.
  function isOpen(e: ClubEvent) {
    if (!e.checkin_opens_at || !e.checkin_closes_at) return false
    const now = Date.now()
    return (
      now >= new Date(e.checkin_opens_at).getTime() &&
      now <= new Date(e.checkin_closes_at).getTime()
    )
  }

  // Not logged in: show join / log in form
  if (!session) {
    return (
      <div>
        <h2>Join GWC</h2>
        <input
          placeholder="Full name (for joining)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <br />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button onClick={signUp}>Join us</button>
        <button onClick={logIn}>Log in</button>
        {message && <p>{message}</p>}
      </div>
    )
  }

  // Logged in: show events with check-in buttons
  return (
    <div>
      <h2>Check in</h2>
      <p>
        Signed in as {session.user.email}{' '}
        <button onClick={logOut}>Log out</button>
      </p>
      {message && <p>{message}</p>}
      {events.length === 0 && <p>No events yet.</p>}
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            {e.title} - {new Date(e.starts_at).toLocaleString()}{' '}
            {checkedIn.has(e.id) ? (
              <span>✓ Checked in</span>
            ) : (
              <button onClick={() => checkIn(e.id)} disabled={!isOpen(e)}>
                {isOpen(e) ? 'Check in' : 'Check-in closed'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}