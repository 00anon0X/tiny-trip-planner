import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  applyPreset,
  costOptions,
  dayCount,
  duplicateTrip,
  emptyLogistics,
  formatDate,
  generatePlan,
  googleDirectionsUrl,
  googleIdeasUrl,
  googleMapsSearchUrl,
  interests,
  makeSavedTrip,
  parseImportedTrip,
  photoForDestination,
  photosForDestination,
  presets,
  safeReadJson,
  sampleTrip,
  slotOrder,
  tripToIcs,
  tripToJson,
  travelPhotos,
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

const KEYS = {
  form: 'tinytrip:form',
  plan: 'tinytrip:plan',
  logistics: 'tinytrip:logistics',
  saved: 'tinytrip:savedTrips',
  active: 'tinytrip:activeTripId',
}

type Toast = { message: string; action?: { label: string; run: () => void } }

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function safeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tiny-trip'
}

function App() {
  const [form, setForm] = useState<TripForm>(() => safeReadJson(localStorage.getItem(KEYS.form), sampleTrip))
  const [logistics, setLogistics] = useState<TripLogistics>(() => safeReadJson(localStorage.getItem(KEYS.logistics), emptyLogistics))
  const [plan, setPlan] = useState<DayPlan[]>(() => safeReadJson(localStorage.getItem(KEYS.plan), generatePlan(sampleTrip)))
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => safeReadJson(localStorage.getItem(KEYS.saved), []))
  const [activeTripId, setActiveTripId] = useState<string>(() => localStorage.getItem(KEYS.active) ?? '')
  const [tripsOpen, setTripsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [lastDeleted, setLastDeleted] = useState<{ dayId: string; activity: Activity; index: number } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const days = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate])
  const activePhoto = photoForDestination(form.destination)
  const dayPhotos = photosForDestination(form.destination)
  const currentTrip = useMemo(() => makeSavedTrip(form, logistics, plan, savedTrips.find((trip) => trip.id === activeTripId)), [activeTripId, form, logistics, plan, savedTrips])
  const activeSavedTrip = savedTrips.find((trip) => trip.id === activeTripId)
  const error = !form.destination.trim()
    ? 'Add a destination to generate a useful plan.'
    : days < 1
      ? 'End date must be after the start date.'
      : days > 14
        ? 'Tiny Trip Planner supports trips up to 14 days.'
        : ''

  useEffect(() => {
    localStorage.setItem(KEYS.form, JSON.stringify(form))
    localStorage.setItem(KEYS.plan, JSON.stringify(plan))
    localStorage.setItem(KEYS.logistics, JSON.stringify(logistics))
    localStorage.setItem(KEYS.saved, JSON.stringify(savedTrips))
    if (activeTripId) localStorage.setItem(KEYS.active, activeTripId)
  }, [activeTripId, form, logistics, plan, savedTrips])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), toast.action ? 5200 : 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function notify(message: string, action?: Toast['action']) {
    setToast({ message, action })
  }

  function update<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateLogistics<K extends keyof TripLogistics>(key: K, value: TripLogistics[K]) {
    setLogistics((current) => ({ ...current, [key]: value }))
  }

  function toggleInterest(interest: string) {
    update('interests', form.interests.includes(interest) ? form.interests.filter((item) => item !== interest) : [...form.interests, interest])
  }

  function generate() {
    if (error) return
    setPlan(generatePlan(form))
    notify('Itinerary generated.')
    document.querySelector('#itinerary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function saveTrip() {
    const trip = makeSavedTrip(form, logistics, plan, activeSavedTrip)
    setSavedTrips((current) => upsertSavedTrip(current, trip))
    setActiveTripId(trip.id)
    notify('Trip saved locally on this device.')
  }

  function loadTrip(trip: SavedTrip) {
    setForm(trip.form)
    setLogistics(trip.logistics)
    setPlan(trip.plan)
    setActiveTripId(trip.id)
    setTripsOpen(false)
    notify(`Loaded ${trip.name}.`)
  }

  function renameTrip(id: string) {
    const next = window.prompt('Rename trip', savedTrips.find((trip) => trip.id === id)?.name ?? '')
    if (!next) return
    setSavedTrips((current) => current.map((trip) => trip.id === id ? { ...trip, name: next, updatedAt: new Date().toISOString() } : trip))
    notify('Trip renamed.')
  }

  function deleteTrip(id: string) {
    if (!window.confirm('Delete this saved trip from this device?')) return
    setSavedTrips((current) => current.filter((trip) => trip.id !== id))
    if (activeTripId === id) setActiveTripId('')
    notify('Trip deleted.')
  }

  function duplicateSavedTrip(trip: SavedTrip) {
    const copy = duplicateTrip(trip)
    setSavedTrips((current) => upsertSavedTrip(current, copy))
    notify('Trip duplicated.')
  }

  function updateActivity(dayId: string, activityId: string, patch: Partial<Activity>) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: day.activities.map((activity) => activity.id === activityId ? { ...activity, ...patch } : activity) } : day))
  }

  function moveActivity(dayId: string, activityId: string, direction: -1 | 1) {
    setPlan((current) => current.map((day) => {
      if (day.id !== dayId) return day
      const index = day.activities.findIndex((activity) => activity.id === activityId)
      const target = index + direction
      if (target < 0 || target >= day.activities.length) return day
      const activities = [...day.activities]
      const [item] = activities.splice(index, 1)
      activities.splice(target, 0, item)
      return { ...day, activities }
    }))
    notify('Activity moved.')
  }

  function addActivity(dayId: string, template: Partial<Activity> = {}) {
    setPlan((current) => current.map((day) => day.id === dayId ? {
      ...day,
      activities: [...day.activities, { id: `${day.id}-${Date.now()}`, slot: template.slot ?? 'Flex', title: template.title ?? 'New plan item', note: template.note ?? 'Add timing, booking, or backup notes here.', cost: template.cost ?? '$$', location: template.location ?? '', backup: template.backup ?? 'nearby café or indoor backup' }],
    } : day))
    setCollapsedDays((current) => ({ ...current, [dayId]: false }))
    notify('Activity added.')
  }

  function deleteActivity(dayId: string, activityId: string) {
    const day = plan.find((item) => item.id === dayId)
    const index = day?.activities.findIndex((activity) => activity.id === activityId) ?? -1
    const activity = day?.activities[index]
    if (!activity) return
    setLastDeleted({ dayId, activity, index })
    setPlan((current) => current.map((item) => item.id === dayId ? { ...item, activities: item.activities.filter((candidate) => candidate.id !== activityId) } : item))
    notify('Activity deleted.', { label: 'Undo', run: undoDelete })
  }

  function undoDelete() {
    if (!lastDeleted) return
    setPlan((current) => current.map((day) => {
      if (day.id !== lastDeleted.dayId) return day
      const activities = [...day.activities]
      activities.splice(lastDeleted.index, 0, lastDeleted.activity)
      return { ...day, activities }
    }))
    setLastDeleted(null)
    setToast(null)
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(tripToMarkdown(currentTrip))
    notify('Itinerary copied.')
  }

  function exportFile(kind: 'md' | 'json' | 'ics') {
    const name = safeSlug(form.destination)
    if (kind === 'md') downloadText(`${name}-plan.md`, tripToMarkdown(currentTrip), 'text/markdown')
    if (kind === 'json') downloadText(`${name}-backup.json`, tripToJson(currentTrip), 'application/json')
    if (kind === 'ics') downloadText(`${name}-calendar.ics`, tripToIcs(currentTrip), 'text/calendar')
    setExportOpen(false)
    notify('Export started.')
  }

  async function importTrip(file: File) {
    const text = await file.text()
    const trip = parseImportedTrip(text)
    if (!trip) {
      notify('Import failed: invalid trip backup.')
      return
    }
    const imported = makeSavedTrip(trip.form, trip.logistics, trip.plan, { name: `${trip.name} imported` })
    setSavedTrips((current) => upsertSavedTrip(current, imported))
    loadTrip(imported)
    notify('Trip backup imported.')
  }

  const activityTemplates: Partial<Activity>[] = [
    { title: 'Meal reservation', note: 'Add restaurant, booking time, and confirmation notes.', slot: 'Evening', cost: '$$' },
    { title: 'Transit buffer', note: 'Leave margin for ticketing, transfers, and walking.', slot: 'Flex', cost: '$' },
    { title: 'Rainy-day backup', note: 'Indoor fallback if weather or energy turns.', slot: 'Flex', cost: '$' },
    { title: 'Free time', note: 'Keep this unscheduled for discoveries or rest.', slot: 'Flex', cost: 'Free' },
  ]

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Tiny Trip Planner home"><span>✈</span>Tiny Trip</a>
        <div className="nav-links">
          <a href="#planner">Plan</a><a href="#trips">Trips</a><a href="#logistics">Logistics</a><a href="#itinerary">Itinerary</a><a href="#packing">Export</a>
        </div>
        <button type="button" className="ghost" onClick={() => setTripsOpen(true)}>Trips ({savedTrips.length})</button>
      </nav>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Browser-only tiny trip planner</p>
          <h1>A pocket-sized travel app for tiny trips.</h1>
          <p className="hero-copy">Save multiple trips, start from presets, add your home base, export backups, and keep an editable day-by-day plan that works entirely in your browser.</p>
          <div className="hero-actions">
            <a className="primary-link" href="#planner">Plan my trip</a>
            <button type="button" className="ghost" onClick={() => { setForm(sampleTrip); setPlan(generatePlan(sampleTrip)); setLogistics(emptyLogistics); notify('Lisbon sample loaded.') }}>Load Lisbon sample</button>
            <button type="button" className="ghost" onClick={saveTrip}>Save locally</button>
          </div>
          <div className="status-row"><span>{activeSavedTrip ? `Editing ${activeSavedTrip.name}` : 'Draft trip'}</span><span>Saved on this device · export JSON to move devices</span></div>
        </div>
        <aside className="hero-card photo-card" aria-label="Trip preview">
          <img src={activePhoto.url} alt={`${activePhoto.city} travel inspiration`} />
          <div className="photo-overlay"><span className="pin">📍 {activePhoto.label}</span><strong>{form.destination || 'Your destination'}</strong><p>{Math.max(days, 0)} day{days === 1 ? '' : 's'} · {form.travelers} traveler{form.travelers === 1 ? '' : 's'} · {form.pace}</p></div>
        </aside>
      </section>

      <section className="photo-strip" aria-label="Travel inspiration photos">
        {travelPhotos.map((photo) => <article key={photo.city}><img src={photo.url} alt={`${photo.city} inspiration`} loading="lazy" /><div><span>{photo.city}</span><p>{photo.label}</p></div></article>)}
      </section>

      <section className="workspace" id="planner">
        <form className="panel controls" onSubmit={(event) => { event.preventDefault(); generate() }}>
          <div className="section-heading"><span>01 / Trip inputs</span><h2>Tell it just enough.</h2></div>
          <div className="preset-grid" aria-label="Trip presets">
            {presets.map((preset) => <button key={preset.id} type="button" className="preset-card" onClick={() => { setForm((current) => applyPreset(current, preset.id)); notify(`${preset.label} preset applied.`) }}><span>{preset.icon}</span><strong>{preset.label}</strong><small>{preset.description}</small></button>)}
          </div>
          <label>Destination<input value={form.destination} onChange={(event) => update('destination', event.target.value)} placeholder="Tokyo, Seoul, Lisbon..." /></label>
          <div className="two-col"><label>Start date<input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label><label>End date<input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} /></label></div>
          <div className="two-col"><label>Travelers<input type="number" min="1" max="12" value={form.travelers} onChange={(event) => update('travelers', Number(event.target.value))} /></label><label>Budget<select value={form.budget} onChange={(event) => update('budget', event.target.value as Budget)}><option>Shoestring</option><option>Comfort</option><option>Treat yourself</option></select></label></div>
          <fieldset><legend>Pace</legend><div className="chip-row">{(['Relaxed', 'Balanced', 'Packed'] as Pace[]).map((pace) => <button key={pace} type="button" className={form.pace === pace ? 'chip selected' : 'chip'} onClick={() => update('pace', pace)}>{pace}</button>)}</div></fieldset>
          <fieldset><legend>Interests</legend><div className="chip-row interests">{interests.map((interest) => <button key={interest} type="button" className={form.interests.includes(interest) ? 'chip selected' : 'chip'} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></fieldset>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={Boolean(error)} type="submit">Generate itinerary</button>
        </form>

        <section className="main-column">
          <section className="panel logistics" id="logistics">
            <div className="section-heading"><span>02 / Logistics</span><h2>Home base, arrivals, backups.</h2></div>
            <div className="two-col"><label>Home base / hotel<input value={logistics.homeBaseName} onChange={(event) => updateLogistics('homeBaseName', event.target.value)} placeholder="Casa Alfama" /></label><label>Address / neighborhood<input value={logistics.homeBaseAddress} onChange={(event) => updateLogistics('homeBaseAddress', event.target.value)} placeholder="Alfama, Lisbon" /></label></div>
            <div className="two-col"><label>Check-in<input value={logistics.checkInTime} onChange={(event) => updateLogistics('checkInTime', event.target.value)} /></label><label>Check-out<input value={logistics.checkOutTime} onChange={(event) => updateLogistics('checkOutTime', event.target.value)} /></label></div>
            <div className="two-col"><label>Arrival plan<input value={logistics.arrivalMode} onChange={(event) => updateLogistics('arrivalMode', event.target.value)} placeholder="Metro from airport" /></label><label>Departure plan<input value={logistics.departureMode} onChange={(event) => updateLogistics('departureMode', event.target.value)} placeholder="Taxi buffer" /></label></div>
            <label>Important notes<textarea rows={2} value={logistics.importantNotes} onChange={(event) => updateLogistics('importantNotes', event.target.value)} placeholder="Tickets, allergies, luggage, must-book items..." /></label>
            <div className="quick-links"><a href={googleDirectionsUrl(logistics.homeBaseAddress, form.destination)} target="_blank">Map route</a><a href={googleMapsSearchUrl(form.destination, 'food near ' + (logistics.homeBaseAddress || form.destination))} target="_blank">Food nearby</a><a href={googleIdeasUrl(form)} target="_blank">Search ideas</a></div>
          </section>

          <section className="panel output" id="itinerary">
            <div className="output-toolbar sticky-tools">
              <div className="section-heading"><span>03 / Editable itinerary</span><h2>{form.destination || 'Tiny'} in {Math.max(days, 0)} day{days === 1 ? '' : 's'}</h2></div>
              <div className="toolbar-actions"><button type="button" className="ghost" onClick={saveTrip}>{activeSavedTrip ? 'Update saved' : 'Save trip'}</button><button type="button" className="ghost" onClick={copyPlan}>Copy</button><button type="button" className="ghost" onClick={() => setExportOpen((open) => !open)}>Export</button></div>
              {exportOpen && <div className="export-menu"><button onClick={() => exportFile('md')}>Markdown</button><button onClick={() => exportFile('json')}>JSON backup</button><button onClick={() => exportFile('ics')}>Calendar .ics</button><button onClick={() => window.print()}>Print</button><button onClick={() => importRef.current?.click()}>Import JSON</button><input ref={importRef} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importTrip(file); event.currentTarget.value = '' }} /></div>}
            </div>

            <div className="day-tabs">{plan.map((day, index) => <a key={day.id} href={`#${day.id}`}>Day {index + 1}</a>)}</div>
            <div className="day-stack">
              {plan.map((day, dayIndex) => {
                const collapsed = collapsedDays[day.id]
                return <article className="day-card" key={day.id} id={day.id}>
                  <div className="day-photo" style={{ backgroundImage: `url(${dayPhotos[dayIndex % dayPhotos.length]})` }} />
                  <header><span className="day-number">Day {dayIndex + 1}</span><button className="day-toggle" type="button" onClick={() => setCollapsedDays((current) => ({ ...current, [day.id]: !current[day.id] }))}><strong>{formatDate(day.date)} · {day.title}</strong><small>{day.activities.length} stops · {day.estimatedSpend} · {collapsed ? 'expand' : 'collapse'}</small></button></header>
                  {!collapsed && <>
                    <div className="day-intel"><span>Don’t miss: {day.dontMiss}</span><span>Transit: {day.transitNote}</span><span>Rainy backup: {day.rainyDay}</span></div>
                    <div className="timeline">
                      {day.activities.length === 0 ? <p className="empty">No activities yet. Add one below.</p> : day.activities.map((activity, activityIndex) => <div className="activity" key={activity.id}>
                        <select aria-label="Activity time slot" value={activity.slot} onChange={(event) => updateActivity(day.id, activity.id, { slot: event.target.value as Slot })}>{slotOrder.map((slot) => <option key={slot}>{slot}</option>)}</select>
                        <input aria-label="Activity title" value={activity.title} onChange={(event) => updateActivity(day.id, activity.id, { title: event.target.value })} />
                        <textarea aria-label="Activity note" rows={2} value={activity.note} onChange={(event) => updateActivity(day.id, activity.id, { note: event.target.value })} />
                        <div className="activity-meta"><input aria-label="Activity location" value={activity.location ?? ''} onChange={(event) => updateActivity(day.id, activity.id, { location: event.target.value })} placeholder="Location/search hint" /><select aria-label="Activity cost" value={activity.cost} onChange={(event) => updateActivity(day.id, activity.id, { cost: event.target.value as Cost })}>{costOptions.map((cost) => <option key={cost}>{cost}</option>)}</select></div>
                        <div className="activity-actions"><a href={googleMapsSearchUrl(form.destination, activity.location || activity.title)} target="_blank">Maps</a><button type="button" onClick={() => moveActivity(day.id, activity.id, -1)} disabled={activityIndex === 0}>↑</button><button type="button" onClick={() => moveActivity(day.id, activity.id, 1)} disabled={activityIndex === day.activities.length - 1}>↓</button><button type="button" className="danger" onClick={() => deleteActivity(day.id, activity.id)}>Delete</button></div>
                      </div>)}
                    </div>
                    <div className="template-row">{activityTemplates.map((template) => <button key={template.title} type="button" onClick={() => addActivity(day.id, template)}>+ {template.title}</button>)}</div>
                  </>}
                </article>
              })}
            </div>
          </section>
        </section>
      </section>

      <section className="extras" id="packing">
        <article className="image-extra packing-extra"><span>🎒</span><h3>Tiny packing list</h3><ul><li>Passport / ID + bookings</li><li>Comfortable shoes</li><li>Portable charger</li><li>Weather layer</li></ul></article>
        <article className="image-extra budget-extra"><span>💸</span><h3>Budget guardrail</h3><p>{form.budget === 'Shoestring' ? 'Prioritize markets, transit, and free viewpoints.' : form.budget === 'Comfort' ? 'Mix paid anchors with low-cost wandering blocks.' : 'Book one memorable meal or guided activity early.'}</p></article>
        <article className="image-extra map-extra"><span>🗺️</span><h3>Useful links</h3><a href={googleMapsSearchUrl(form.destination)} target="_blank">Open map search</a><a href={googleIdeasUrl(form)} target="_blank">Search ideas</a></article>
      </section>

      {tripsOpen && <div className="drawer-backdrop" onClick={() => setTripsOpen(false)}><aside className="trips-drawer" id="trips" onClick={(event) => event.stopPropagation()}><header><div><p className="eyebrow">Saved locally</p><h2>My trips</h2></div><button className="ghost" onClick={() => setTripsOpen(false)}>Close</button></header><button className="primary" onClick={saveTrip}>Save current trip</button><p className="drawer-note">Trips are stored only in this browser. Export JSON backups to move devices.</p>{savedTrips.length === 0 ? <p className="empty">No saved trips yet.</p> : savedTrips.map((trip) => <article className="trip-row" key={trip.id}><div><strong>{trip.name}</strong><span>{trip.form.destination} · {dayCount(trip.form.startDate, trip.form.endDate)} days · {new Date(trip.updatedAt).toLocaleDateString()}</span></div><div><button onClick={() => loadTrip(trip)}>Open</button><button onClick={() => renameTrip(trip.id)}>Rename</button><button onClick={() => duplicateSavedTrip(trip)}>Duplicate</button><button className="danger" onClick={() => deleteTrip(trip.id)}>Delete</button></div></article>)}</aside></div>}

      <nav className="bottom-nav" aria-label="Mobile app actions"><a href="#planner">Plan</a><button type="button" onClick={() => setTripsOpen(true)}>Trips</button><a href="#itinerary">Days</a><button type="button" onClick={saveTrip}>Save</button><button type="button" onClick={() => setExportOpen((open) => !open)}>Export</button></nav>
      {toast && <div className="toast" role="status"><span>{toast.message}</span>{toast.action && <button type="button" onClick={toast.action.run}>{toast.action.label}</button>}</div>}
    </main>
  )
}

export default App
