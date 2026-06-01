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
import {
  budgetSnapshot,
  checklistItems,
  decodeTripFromShare,
  encodeTripForShare,
  savedIdeaFromRecommendation,
  shareUrl,
  sortTripsForDashboard,
  tripQualityWarnings,
  type SavedIdea,
} from './lib/sprint'
import {
  buildShareSummary,
  featuredItineraries,
  getDashboardRecommendations,
  getTravelerTrends,
  tripReadiness,
  type DashboardRecommendation,
  type FeaturedItinerary,
} from './lib/dashboard'

const KEYS = {
  form: 'tinytrip:form',
  plan: 'tinytrip:plan',
  logistics: 'tinytrip:logistics',
  saved: 'tinytrip:savedTrips',
  active: 'tinytrip:activeTripId',
  ideas: 'tinytrip:savedIdeas',
  checklist: 'tinytrip:checklistDone',
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

function endDateFrom(startDate: string, days: number) {
  const date = new Date(`${startDate}T00:00:00`)
  date.setDate(date.getDate() + Math.max(days - 1, 0))
  return date.toISOString().slice(0, 10)
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

function SharePage({ go }: { go: (view: View) => void }) {
  const encoded = window.location.hash.match(/trip=([^&]+)/)?.[1] ?? ''
  const trip = decodeTripFromShare(encoded)
  return (
    <main className="share-page">
      <nav className="marketing-nav"><button className="brand link-button" onClick={() => go('marketing')}><span>✈</span>Tiny Trip</button><button className="ghost compact" onClick={() => go('login')}>Open app</button></nav>
      {!trip ? <section className="login-card"><p className="eyebrow">Shared trip</p><h1>Trip link missing or expired.</h1><p>Ask for a new Tiny Trip share link.</p><button className="primary" onClick={() => go('login')}>Open dashboard</button></section> : <section className="share-sheet"><p className="eyebrow">Shared itinerary</p><h1>{trip.name}</h1><p>{trip.form.destination} · {dayCount(trip.form.startDate, trip.form.endDate)} days · {trip.form.pace}</p>{trip.plan.map((day, index) => <article className="share-day" key={day.id}><h2>Day {index + 1}: {day.title}</h2><p>{formatDate(day.date)} · Backup: {day.rainyDay}</p>{day.activities.map((activity) => <div className="share-item" key={activity.id}><strong>{activity.slot} · {activity.title}</strong><span>{activity.note}</span><a href={googleMapsSearchUrl(trip.form.destination, activity.location || activity.title)} target="_blank">Map</a></div>)}</article>)}<button className="primary" onClick={() => window.print()}>Print itinerary</button></section>}
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
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(() => safeReadJson(localStorage.getItem(KEYS.ideas), []))
  const [checklistDone, setChecklistDone] = useState<string[]>(() => safeReadJson(localStorage.getItem(KEYS.checklist), []))
  const [activeTripId, setActiveTripId] = useState<string>(() => localStorage.getItem(KEYS.active) ?? '')
  const [panel, setPanel] = useState<'overview' | 'setup' | 'saved' | 'explore' | 'share' | 'export'>('overview')
  const [toast, setToast] = useState('')

  const days = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate])
  const currentTrip = useMemo(() => makeSavedTrip(form, logistics, plan, savedTrips.find((trip) => trip.id === activeTripId)), [activeTripId, form, logistics, plan, savedTrips])
  const activeSavedTrip = savedTrips.find((trip) => trip.id === activeTripId)
  const readiness = useMemo(() => tripReadiness(form, logistics, plan, Boolean(activeSavedTrip)), [activeSavedTrip, form, logistics, plan])
  const recommendations = useMemo(() => getDashboardRecommendations(form, logistics), [form, logistics])
  const trends = useMemo(() => getTravelerTrends(form), [form])
  const shareSummary = useMemo(() => buildShareSummary(currentTrip), [currentTrip])
  const tripCards = useMemo(() => sortTripsForDashboard(savedTrips), [savedTrips])
  const checklist = useMemo(() => checklistItems(form, logistics, plan, Boolean(activeSavedTrip)).map((item) => ({ ...item, done: item.done || checklistDone.includes(item.id) })), [activeSavedTrip, checklistDone, form, logistics, plan])
  const budget = useMemo(() => budgetSnapshot(form, plan), [form, plan])
  const qualityWarnings = useMemo(() => tripQualityWarnings(form, logistics, plan), [form, logistics, plan])
  const currentShareUrl = useMemo(() => shareUrl(currentTrip), [currentTrip])
  const heroPhoto = photoForDestination(form.destination)
  const error = !form.destination.trim() ? 'Destination required.' : days < 1 ? 'End date must be after start date.' : days > 14 ? 'Max 14 days.' : ''

  useEffect(() => {
    localStorage.setItem(KEYS.form, JSON.stringify(form))
    localStorage.setItem(KEYS.plan, JSON.stringify(plan))
    localStorage.setItem(KEYS.logistics, JSON.stringify(logistics))
    localStorage.setItem(KEYS.saved, JSON.stringify(savedTrips))
    localStorage.setItem(KEYS.ideas, JSON.stringify(savedIdeas))
    localStorage.setItem(KEYS.checklist, JSON.stringify(checklistDone))
    if (activeTripId) localStorage.setItem(KEYS.active, activeTripId)
  }, [activeTripId, checklistDone, form, logistics, plan, savedIdeas, savedTrips])

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
  function loadTrip(trip: SavedTrip) { setForm(trip.form); setLogistics(trip.logistics); setPlan(trip.plan); setActiveTripId(trip.id); setPanel('overview'); notify('Trip loaded') }
  function updateActivity(dayId: string, activityId: string, patch: Partial<Activity>) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: day.activities.map((activity) => activity.id === activityId ? { ...activity, ...patch } : activity) } : day))
  }
  function addActivity(dayId: string) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: [...day.activities, { id: `${day.id}-${Date.now()}`, slot: 'Flex', title: 'New item', note: 'Add detail here.', cost: '$', location: '' }] } : day))
  }
  function saveIdea(rec: DashboardRecommendation) {
    setSavedIdeas((current) => [savedIdeaFromRecommendation(rec, form.destination), ...current.filter((idea) => idea.title !== rec.title)])
    notify('Saved for later')
  }
  function addSavedIdea(idea: SavedIdea) {
    setPlan((current) => current.map((day, index) => index === 0 ? { ...day, activities: [...day.activities, { id: `${day.id}-${idea.id}-${Date.now()}`, slot: idea.slot, title: idea.title, note: idea.reason, cost: idea.cost, location: idea.title }] } : day))
    setSavedIdeas((current) => current.filter((item) => item.id !== idea.id))
    notify('Idea added')
  }
  function addRecommendation(rec: DashboardRecommendation) {
    setPlan((current) => current.map((day, index) => index === 0 ? { ...day, activities: [...day.activities, { id: `${day.id}-${rec.id}-${Date.now()}`, slot: rec.slot, title: rec.title, note: rec.reason, cost: rec.cost, location: rec.title }] } : day))
    notify('Recommendation added')
  }
  function cloneTemplate(template: FeaturedItinerary) {
    const nextForm = { ...sampleTrip, destination: template.destination, interests: template.tags.slice(0, 3), pace: 'Balanced' as Pace, startDate: form.startDate, endDate: endDateFrom(form.startDate, template.days) }
    setForm(nextForm)
    setLogistics(emptyLogistics)
    setPlan(generatePlan(nextForm))
    setActiveTripId('')
    setPanel('overview')
    notify('Template cloned')
  }
  function removeActivity(dayId: string, activityId: string) {
    setPlan((current) => current.map((day) => day.id === dayId ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) } : day))
  }
  function toggleChecklist(id: string) {
    setChecklistDone((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
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
          <button aria-current={panel === 'overview' ? 'page' : undefined} className={panel === 'overview' ? 'selected' : ''} onClick={() => setPanel('overview')}>Dashboard</button>
          <button aria-current={panel === 'setup' ? 'page' : undefined} className={panel === 'setup' ? 'selected' : ''} onClick={() => setPanel('setup')}>Plan editor</button>
          <button aria-current={panel === 'explore' ? 'page' : undefined} className={panel === 'explore' ? 'selected' : ''} onClick={() => setPanel('explore')}>Explore</button>
          <button aria-current={panel === 'saved' ? 'page' : undefined} className={panel === 'saved' ? 'selected' : ''} onClick={() => setPanel('saved')}>My Trips <small>{savedTrips.length}</small></button>
          <button aria-current={panel === 'share' ? 'page' : undefined} className={panel === 'share' ? 'selected' : ''} onClick={() => setPanel('share')}>Share</button>
          <button aria-current={panel === 'export' ? 'page' : undefined} className={panel === 'export' ? 'selected' : ''} onClick={() => setPanel('export')}>Export</button>
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
            {panel === 'overview' && <div className="panel-stack">
              <h2>Dashboard</h2>
              <section className="readiness-card"><div><strong>{readiness.score}%</strong><span>Trip readiness</span></div><progress value={readiness.score} max="100" />{readiness.items.map((item) => <p key={item.label} className={item.done ? 'done' : ''}>{item.done ? '✓' : '•'} {item.label}</p>)}</section>
              <section className="mini-card"><h3>Recommended next</h3>{recommendations.slice(0, 3).map((rec) => <article className="recommend-row" key={rec.id}><div><b>{rec.title}</b><span>{rec.tag} · {rec.cost}</span></div><button onClick={() => addRecommendation(rec)}>Add</button></article>)}</section>
              <section className="mini-card"><h3>My Trips</h3>{tripCards.length === 0 ? <p>No saved trips yet. Save this draft to create your first trip card.</p> : tripCards.slice(0, 3).map((trip) => <article className="trip-card-row" key={trip.id}><div><b>{trip.title}</b><span>{trip.destination} · {trip.days} days · {trip.readiness}% ready</span></div><button onClick={() => setPanel('saved')}>Open</button></article>)}</section>
              <section className="mini-card"><h3>Trip checklist</h3>{checklist.slice(0, 5).map((item) => <label className="check-row" key={item.id}><input type="checkbox" checked={item.done} onChange={() => toggleChecklist(item.id)} /> <span>{item.label}</span></label>)}</section>
              <section className="mini-card"><h3>Budget snapshot</h3><p><b>${budget.dailyLow}–${budget.dailyHigh}</b> / day · <b>${budget.totalLow}–${budget.totalHigh}</b> total</p>{budget.categories.map((cat) => <p key={cat.label}>{cat.label}: ${cat.low}–${cat.high}</p>)}</section>
              <section className="mini-card"><h3>Trip quality</h3>{qualityWarnings.length === 0 ? <p>No major warnings.</p> : qualityWarnings.map((warning) => <p key={warning.id} className={warning.severity}><b>{warning.title}</b><br />{warning.detail}</p>)}</section>
              <section className="mini-card"><h3>What travellers often do</h3>{trends.map((trend) => <p key={trend.label}><b>{trend.percent}%</b> {trend.label}</p>)}</section>
            </div>}
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
            {panel === 'explore' && <div className="panel-stack"><h2>Explore</h2><section className="mini-card"><h3>Recommendations</h3>{recommendations.map((rec) => <article className="recommend-row" key={rec.id}><div><b>{rec.title}</b><span>{rec.reason}</span></div><div><button onClick={() => addRecommendation(rec)}>Add</button><button onClick={() => saveIdea(rec)}>Save</button></div></article>)}</section>{savedIdeas.length > 0 && <section className="mini-card"><h3>Saved for later</h3>{savedIdeas.map((idea) => <article className="recommend-row" key={idea.id}><div><b>{idea.title}</b><span>{idea.tag} · {idea.destination}</span></div><button onClick={() => addSavedIdea(idea)}>Add</button></article>)}</section>}<section className="mini-card"><h3>Highest-rated itineraries</h3>{featuredItineraries.map((template) => <article className="template-row" key={template.id}><div><b>{template.title}</b><span>{template.days} days · ★ {template.rating} · {template.saves} saves</span><p>{template.angle}</p></div><button onClick={() => cloneTemplate(template)}>Clone</button></article>)}</section></div>}
            {panel === 'saved' && <div className="panel-stack"><h2>Saved trips</h2>{savedTrips.length === 0 ? <p className="muted">No saved trips yet.</p> : savedTrips.map((trip) => <article className="saved-row trip-card" key={trip.id}><strong>{trip.name}</strong><span>{trip.form.destination} · {dayCount(trip.form.startDate, trip.form.endDate)} days</span><div><button onClick={() => loadTrip(trip)}>Open</button><button onClick={() => setSavedTrips((current) => upsertSavedTrip(current, duplicateTrip(trip)))}>Duplicate</button><button onClick={() => setSavedTrips((current) => current.filter((item) => item.id !== trip.id))}>Delete</button></div></article>)}</div>}
            {panel === 'share' && <div className="panel-stack"><h2>Share itinerary</h2><p className="muted">Friend-friendly summary. No public backend yet, so this copies the plan text.</p><textarea readOnly value={shareSummary} rows={10} /><label>Share link<input readOnly value={currentShareUrl} /></label><button className="primary" onClick={() => navigator.clipboard.writeText(currentShareUrl).then(() => notify('Share link copied'))}>Copy share link</button><button className="ghost" onClick={() => navigator.clipboard.writeText(shareSummary).then(() => notify('Share summary copied'))}>Copy share summary</button><button className="ghost" onClick={() => window.open(`/share#trip=${encodeTripForShare(currentTrip)}`, '_blank')}>Open share view</button><button className="ghost" onClick={() => window.print()}>Print share view</button></div>}
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
  if (view === 'share') return <SharePage go={go} />
  return <DashboardPage go={go} />
}

export default App
