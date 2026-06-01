import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  applyPreset,
  costOptions,
  dayCount,
  duplicateTrip,
  emptyLogistics,
  formatDate,
  generatePlan,
  googleIdeasUrl,
  googleMapsSearchUrl,
  interests,
  makeSavedTrip,
  parseImportedTrip,
  photoForDestination,
  presets,
  safeReadJson,
  sampleTrip,
  slotOrder,
  tripToIcs,
  tripToJson,
  tripToMarkdown,
  upsertSavedTrip,
  type Activity,
  type Budget,
  type Cost,
  type DayPlan,
  type Pace,
  type SavedTrip,
  type Slot,
  type TripForm,
  type TripLogistics,
} from './lib/trip'
import { pathFor, resolveView, type View } from './lib/routes'

const KEYS = {
  form: 'tinytrip:form',
  plan: 'tinytrip:plan',
  logistics: 'tinytrip:logistics',
  saved: 'tinytrip:savedTrips',
  active: 'tinytrip:activeTripId',
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tiny-trip'
}

function useRoute() {
  const [view, setView] = useState<View>(() => resolveView(window.location.pathname))
  useEffect(() => {
    const onPop = () => setView(resolveView(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  function go(next: View) {
    window.history.pushState({}, '', pathFor(next))
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return { view, go }
}

function MarketingPage({ go }: { go: (view: View) => void }) {
  return (
    <main className="marketing-page">
      <nav className="marketing-nav">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); go('marketing') }}><span>✈</span>Tiny Trip</a>
        <button className="ghost compact" onClick={() => go('login')}>Open app</button>
      </nav>
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Trip planning without spreadsheet chaos</p>
          <h1>Plan a small trip without making it a big project.</h1>
          <p>Tiny Trip keeps short getaways focused: a clean day plan, local backups, saved trips, and simple exports. No account required for this demo.</p>
          <div className="hero-actions"><button className="primary" onClick={() => go('login')}>Try the planner</button><a className="ghost" href="#features">See features</a></div>
        </div>
        <div className="landing-card">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Alfama%2C_Lisbon_%28DSC03367%29.jpg/1280px-Alfama%2C_Lisbon_%28DSC03367%29.jpg" alt="Lisbon street view" />
          <div><strong>Lisbon weekend</strong><span>3 days · food · culture · relaxed</span></div>
        </div>
      </section>
      <section className="feature-strip" id="features">
        <article><b>01</b><h2>Make the plan</h2><p>Pick dates, pace, budget, and interests. Get an editable itinerary.</p></article>
        <article><b>02</b><h2>Keep it practical</h2><p>Add home base, arrival notes, rainy-day backups, and maps links.</p></article>
        <article><b>03</b><h2>Take it with you</h2><p>Save locally, export Markdown, JSON backup, calendar file, or print.</p></article>
      </section>
    </main>
  )
}

function LoginPage({ go }: { go: (view: View) => void }) {
  return (
    <main className="login-page">
      <button className="brand link-button" onClick={() => go('marketing')}><span>✈</span>Tiny Trip</button>
      <section className="login-card">
        <p className="eyebrow">Demo login</p>
        <h1>Open your trip dashboard.</h1>
        <p>No username or password yet. This is only a placeholder gate so the landing page and actual product UX stay separate.</p>
        <button className="primary" onClick={() => go('dashboard')}>Continue to dashboard</button>
        <button className="ghost" onClick={() => go('marketing')}>Back to landing page</button>
      </section>
    </main>
  )
}

function DashboardPage({ go }: { go: (view: View) => void }) {
  const [form, setForm] = useState<TripForm>(() => safeReadJson(localStorage.getItem(KEYS.form), sampleTrip))
  const [logistics, setLogistics] = useState<TripLogistics>(() => safeReadJson(localStorage.getItem(KEYS.logistics), emptyLogistics))
  const [plan, setPlan] = useState<DayPlan[]>(() => safeReadJson(localStorage.getItem(KEYS.plan), generatePlan(sampleTrip)))
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => safeReadJson(localStorage.getItem(KEYS.saved), []))
  const [activeTripId, setActiveTripId] = useState<string>(() => localStorage.getItem(KEYS.active) ?? '')
  const [panel, setPanel] = useState<'setup' | 'saved' | 'export'>('setup')
  const [toast, setToast] = useState('')

  const days = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate])
  const currentTrip = useMemo(() => makeSavedTrip(form, logistics, plan, savedTrips.find((trip) => trip.id === activeTripId)), [activeTripId, form, logistics, plan, savedTrips])
  const activeSavedTrip = savedTrips.find((trip) => trip.id === activeTripId)
  const heroPhoto = photoForDestination(form.destination)
  const error = !form.destination.trim() ? 'Destination required.' : days < 1 ? 'End date must be after start date.' : days > 14 ? 'Max 14 days.' : ''

  useEffect(() => {
    localStorage.setItem(KEYS.form, JSON.stringify(form))
    localStorage.setItem(KEYS.plan, JSON.stringify(plan))
    localStorage.setItem(KEYS.logistics, JSON.stringify(logistics))
    localStorage.setItem(KEYS.saved, JSON.stringify(savedTrips))
    if (activeTripId) localStorage.setItem(KEYS.active, activeTripId)
  }, [activeTripId, form, logistics, plan, savedTrips])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function update<K extends keyof TripForm>(key: K, value: TripForm[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function updateLogistics<K extends keyof TripLogistics>(key: K, value: TripLogistics[K]) { setLogistics((current) => ({ ...current, [key]: value })) }
  function notify(message: string) { setToast(message) }
  function generate() { if (!error) { setPlan(generatePlan(form)); notify('Plan refreshed') } }
  function saveTrip() {
    const trip = makeSavedTrip(form, logistics, plan, activeSavedTrip)
    setSavedTrips((current) => upsertSavedTrip(current, trip))
    setActiveTripId(trip.id)
    notify('Trip saved')
  }
  function loadTrip(trip: SavedTrip) { setForm(trip.form); setLogistics(trip.logistics); setPlan(trip.plan); setActiveTripId(trip.id); setPanel('setup'); notify('Trip loaded') }
  function updateActivity(dayId: string, activityId: string, patch: Partial<Activity>) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: day.activities.map((activity) => activity.id === activityId ? { ...activity, ...patch } : activity) } : day))
  }
  function addActivity(dayId: string) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: [...day.activities, { id: `${day.id}-${Date.now()}`, slot: 'Flex', title: 'New item', note: 'Add detail here.', cost: '$', location: '' }] } : day))
  }
  function removeActivity(dayId: string, activityId: string) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) } : day))
  }
  function exportFile(kind: 'md' | 'json' | 'ics') {
    const name = slug(form.destination)
    if (kind === 'md') downloadText(`${name}.md`, tripToMarkdown(currentTrip), 'text/markdown')
    if (kind === 'json') downloadText(`${name}.json`, tripToJson(currentTrip), 'application/json')
    if (kind === 'ics') downloadText(`${name}.ics`, tripToIcs(currentTrip), 'text/calendar')
    notify('Export started')
  }
  async function importTrip(file: File) {
    const trip = parseImportedTrip(await file.text())
    if (!trip) { notify('Invalid backup'); return }
    const imported = makeSavedTrip(trip.form, trip.logistics, trip.plan, { name: `${trip.name} imported` })
    setSavedTrips((current) => upsertSavedTrip(current, imported))
    loadTrip(imported)
  }

  return (
    <main className="dashboard-page">
      <aside className="app-sidebar">
        <button className="brand link-button" onClick={() => go('marketing')}><span>✈</span>Tiny Trip</button>
        <div className="sidebar-actions">
          <button className={panel === 'setup' ? 'selected' : ''} onClick={() => setPanel('setup')}>Plan setup</button>
          <button className={panel === 'saved' ? 'selected' : ''} onClick={() => setPanel('saved')}>Saved trips <small>{savedTrips.length}</small></button>
          <button className={panel === 'export' ? 'selected' : ''} onClick={() => setPanel('export')}>Export</button>
        </div>
        <button className="ghost compact" onClick={() => go('login')}>Log out demo</button>
      </aside>

      <section className="dashboard-main">
        <header className="app-header">
          <div><p className="eyebrow">Dashboard</p><h1>{form.destination || 'New trip'}</h1><p>{Math.max(days, 0)} day{days === 1 ? '' : 's'} · {form.travelers} traveler{form.travelers === 1 ? '' : 's'} · {form.pace}</p></div>
          <img src={heroPhoto.url} alt={`${heroPhoto.city} inspiration`} />
        </header>

        <section className="app-grid">
          <aside className="control-card">
            {panel === 'setup' && <div className="panel-stack">
              <h2>Plan setup</h2>
              <label>Destination<input value={form.destination} onChange={(event) => update('destination', event.target.value)} /></label>
              <div className="split"><label>Start<input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label><label>End<input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} /></label></div>
              <div className="split"><label>Travelers<input type="number" min="1" max="12" value={form.travelers} onChange={(event) => update('travelers', Number(event.target.value))} /></label><label>Budget<select value={form.budget} onChange={(event) => update('budget', event.target.value as Budget)}><option>Shoestring</option><option>Comfort</option><option>Treat yourself</option></select></label></div>
              <label>Preset<select onChange={(event) => event.target.value && setForm((current) => applyPreset(current, event.target.value))} defaultValue=""><option value="">Choose a preset...</option>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.icon} {preset.label}</option>)}</select></label>
              <div className="chips">{(['Relaxed', 'Balanced', 'Packed'] as Pace[]).map((pace) => <button key={pace} className={form.pace === pace ? 'selected' : ''} onClick={() => update('pace', pace)}>{pace}</button>)}</div>
              <details><summary>Interests</summary><div className="chips">{interests.map((interest) => <button key={interest} className={form.interests.includes(interest) ? 'selected' : ''} onClick={() => update('interests', form.interests.includes(interest) ? form.interests.filter((item) => item !== interest) : [...form.interests, interest])}>{interest}</button>)}</div></details>
              <details><summary>Logistics</summary><label>Home base<input value={logistics.homeBaseName} onChange={(event) => updateLogistics('homeBaseName', event.target.value)} placeholder="Hotel / apartment" /></label><label>Neighborhood<input value={logistics.homeBaseAddress} onChange={(event) => updateLogistics('homeBaseAddress', event.target.value)} /></label><label>Notes<textarea value={logistics.importantNotes} onChange={(event) => updateLogistics('importantNotes', event.target.value)} rows={3} /></label></details>
              {error && <p className="error">{error}</p>}
              <button className="primary" onClick={generate} disabled={Boolean(error)}>Generate plan</button>
              <button className="ghost" onClick={saveTrip}>Save trip</button>
            </div>}
            {panel === 'saved' && <div className="panel-stack"><h2>Saved trips</h2>{savedTrips.length === 0 ? <p className="muted">No saved trips yet.</p> : savedTrips.map((trip) => <article className="saved-row" key={trip.id}><strong>{trip.name}</strong><span>{trip.form.destination} · {dayCount(trip.form.startDate, trip.form.endDate)} days</span><div><button onClick={() => loadTrip(trip)}>Open</button><button onClick={() => setSavedTrips((current) => upsertSavedTrip(current, duplicateTrip(trip)))}>Duplicate</button><button onClick={() => setSavedTrips((current) => current.filter((item) => item.id !== trip.id))}>Delete</button></div></article>)}</div>}
            {panel === 'export' && <div className="panel-stack"><h2>Export</h2><button className="ghost" onClick={() => navigator.clipboard.writeText(tripToMarkdown(currentTrip)).then(() => notify('Copied'))}>Copy Markdown</button><button className="ghost" onClick={() => exportFile('md')}>Download Markdown</button><button className="ghost" onClick={() => exportFile('json')}>Download JSON backup</button><button className="ghost" onClick={() => exportFile('ics')}>Download calendar</button><button className="ghost" onClick={() => window.print()}>Print</button><label className="file-button">Import JSON<input hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importTrip(file) }} /></label></div>}
          </aside>

          <section className="itinerary-card">
            <div className="itinerary-toolbar"><div><h2>Itinerary</h2><p>{activeSavedTrip ? `Editing ${activeSavedTrip.name}` : 'Unsaved draft'}</p></div><div><button className="ghost compact" onClick={saveTrip}>Save</button><a href={googleMapsSearchUrl(form.destination)} target="_blank">View map</a><a href={googleIdeasUrl(form)} target="_blank">Get ideas</a></div></div>
            <div className="day-list">{plan.map((day, dayIndex) => <article className="simple-day" key={day.id}><header><span>Day {dayIndex + 1}</span><div><h3>{formatDate(day.date)} · {day.title}</h3><p>{day.dontMiss} · {day.estimatedSpend}</p></div></header><div className="intel"><b>Backup:</b> {day.rainyDay}</div>{day.activities.map((activity) => <div className="simple-activity" key={activity.id}><div className="activity-summary"><span>{activity.slot}</span><div><strong>{activity.title}</strong><p>{activity.note}</p></div><em>{activity.cost}</em></div><div className="activity-quick-actions"><a href={googleMapsSearchUrl(form.destination, activity.location || activity.title)} target="_blank">Map</a><button onClick={() => removeActivity(day.id, activity.id)}>Remove</button></div><details><summary>Edit details</summary><div className="activity-editor"><select value={activity.slot} onChange={(event) => updateActivity(day.id, activity.id, { slot: event.target.value as Slot })}>{slotOrder.map((slot) => <option key={slot}>{slot}</option>)}</select><input value={activity.title} onChange={(event) => updateActivity(day.id, activity.id, { title: event.target.value })} /><select value={activity.cost} onChange={(event) => updateActivity(day.id, activity.id, { cost: event.target.value as Cost })}>{costOptions.map((cost) => <option key={cost}>{cost}</option>)}</select><textarea value={activity.note} onChange={(event) => updateActivity(day.id, activity.id, { note: event.target.value })} rows={2} /></div></details></div>)}<button className="add-line" onClick={() => addActivity(day.id)}>+ Add item</button></article>)}</div>
          </section>
        </section>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}

function App() {
  const { view, go } = useRoute()
  if (view === 'marketing') return <MarketingPage go={go} />
  if (view === 'login') return <LoginPage go={go} />
  return <DashboardPage go={go} />
}

export default App
