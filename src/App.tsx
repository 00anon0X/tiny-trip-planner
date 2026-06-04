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
  googleDirectionsUrl,
  googleMapsSearchUrl,
  interests,
  makeSavedTrip,
  parseImportedTrip,
  presets,
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
  removeSavedIdea,
  savedIdeaFromRecommendation,
  sharePrintBrief,
  shareUrl,
  sortSavedIdeas,
  tripQualityWarnings,
  type SavedIdea,
} from './lib/sprint'
import {
  buildShareSummary,
  getDashboardRecommendations,
  tripReadiness,
  type DashboardRecommendation,
} from './lib/dashboard'
import {
  addIdeaToPlanDay,
  buildTimeline,
  categorizeIdea,
  cloneTemplateToDraft,
  expandedTemplates,
  filterSavedIdeas,
  filterTemplates,
  forkSharedTrip,
  rewriteTripPlan,
  safeReadStorageJson,
  safeWriteStorageJson,
  searchTrips,
  selectedTimelineDays,
  type IdeaCategory,
  type TimelineMode,
  type TripTemplate,
} from './lib/enhancements'
import {
  compareTrips,
  quickStartDraft,
  templateToComparableTrip,
  todayCommandCenter,
  tripHealthSummary,
  type TripComparison,
} from './lib/fullUpgrade'

const KEYS = {
  form: 'tinytrip:form',
  plan: 'tinytrip:plan',
  logistics: 'tinytrip:logistics',
  saved: 'tinytrip:savedTrips',
  active: 'tinytrip:activeTripId',
  ideas: 'tinytrip:savedIdeas',
  checklist: 'tinytrip:checklistDone',
  onboarding: 'tinytrip:onboarding',
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

function SharePage({ go }: { go: (view: View) => void }) {
  const encoded = window.location.hash.match(/trip=([^&]+)/)?.[1] ?? ''
  const trip = decodeTripFromShare(encoded)
  const brief = trip ? sharePrintBrief(trip) : []
  function forkTrip() {
    if (!trip) return
    const fork = forkSharedTrip(trip)
    const saved = safeReadStorageJson<SavedTrip[]>(localStorage, KEYS.saved, []).value
    safeWriteStorageJson(localStorage, KEYS.form, fork.form)
    safeWriteStorageJson(localStorage, KEYS.logistics, fork.logistics)
    safeWriteStorageJson(localStorage, KEYS.plan, fork.plan)
    safeWriteStorageJson(localStorage, KEYS.saved, upsertSavedTrip(saved, fork))
    localStorage.setItem(KEYS.active, fork.id)
    go('dashboard')
  }
  return (
    <main className="share-page">
      <nav className="marketing-nav"><button className="brand link-button" onClick={() => go('marketing')}><span>✈</span>Tiny Trip</button><button className="ghost compact" onClick={() => go('login')}>Open app</button></nav>
      {!trip ? <section className="login-card"><p className="eyebrow">Shared trip</p><h1>Trip link missing or expired.</h1><p>Ask for a new Tiny Trip share link.</p><button className="primary" onClick={() => go('login')}>Open dashboard</button></section> : <section className="share-sheet"><p className="eyebrow">Shared itinerary</p><h1>{trip.name}</h1><p>{trip.form.destination} · {dayCount(trip.form.startDate, trip.form.endDate)} days · {trip.form.pace}</p><section className="share-brief" aria-label="Trip handoff details"><h2>Trip handoff</h2>{brief.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</section>{trip.plan.map((day, index) => <article className="share-day" key={day.id}><h2>Day {index + 1}: {day.title}</h2><p>{formatDate(day.date)} · Backup: {day.rainyDay}</p>{day.activities.map((activity) => <div className="share-item" key={activity.id}><strong>{activity.slot} · {activity.title}</strong><span>{activity.note}</span><a href={googleMapsSearchUrl(trip.form.destination, activity.location || activity.title)} target="_blank">Map</a></div>)}</article>)}<div className="share-actions"><button className="primary" onClick={forkTrip}>Use this trip</button><button className="ghost" onClick={() => window.print()}>Print itinerary</button></div></section>}
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
  const [form, setForm] = useState<TripForm>(() => safeReadStorageJson(localStorage, KEYS.form, sampleTrip).value)
  const [logistics, setLogistics] = useState<TripLogistics>(() => safeReadStorageJson(localStorage, KEYS.logistics, emptyLogistics).value)
  const [plan, setPlan] = useState<DayPlan[]>(() => safeReadStorageJson(localStorage, KEYS.plan, generatePlan(sampleTrip)).value)
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => safeReadStorageJson(localStorage, KEYS.saved, []).value)
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(() => safeReadStorageJson(localStorage, KEYS.ideas, []).value)
  const [checklistDone, setChecklistDone] = useState<string[]>(() => safeReadStorageJson(localStorage, KEYS.checklist, []).value)
  const [activeTripId, setActiveTripId] = useState<string>(() => localStorage.getItem(KEYS.active) ?? '')
  const [panel, setPanel] = useState<'overview' | 'setup' | 'saved' | 'explore' | 'share'>('overview')
  const [compareTarget, setCompareTarget] = useState<SavedTrip | null>(null)
  const [toast, setToast] = useState('')
  const [timelineMode, setTimelineMode] = useState<TimelineMode>('all')
  const [tripSearch, setTripSearch] = useState('')
  const [ideaSearch, setIdeaSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [ideaCategory] = useState<IdeaCategory | 'All'>('All')
  const [ideaTargetDay] = useState('')

  const days = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate])
  const currentTrip = useMemo(() => makeSavedTrip(form, logistics, plan, savedTrips.find((trip) => trip.id === activeTripId)), [activeTripId, form, logistics, plan, savedTrips])
  const activeSavedTrip = savedTrips.find((trip) => trip.id === activeTripId)
  const readiness = useMemo(() => tripReadiness(form, logistics, plan, Boolean(activeSavedTrip)), [activeSavedTrip, form, logistics, plan])
  const recommendations = useMemo(() => getDashboardRecommendations(form, logistics), [form, logistics])
  const shareSummary = useMemo(() => buildShareSummary(currentTrip), [currentTrip])
  const savedIdeaCards = useMemo(() => sortSavedIdeas(savedIdeas), [savedIdeas])
  const visibleIdeas = useMemo(() => filterSavedIdeas(savedIdeaCards, ideaSearch, ideaCategory), [ideaCategory, ideaSearch, savedIdeaCards])
  const visibleSavedTrips = useMemo(() => searchTrips(savedTrips, tripSearch), [savedTrips, tripSearch])
  const visibleTemplates = useMemo(() => filterTemplates(expandedTemplates, templateSearch), [templateSearch])
  const timeline = useMemo(() => buildTimeline(plan), [plan])
  const visiblePlan = useMemo(() => selectedTimelineDays(timeline, timelineMode), [timeline, timelineMode])
  const checklist = useMemo(() => checklistItems(form, logistics, plan, Boolean(activeSavedTrip)).map((item) => ({ ...item, done: item.done || checklistDone.includes(item.id) })), [activeSavedTrip, checklistDone, form, logistics, plan])
  const budget = useMemo(() => budgetSnapshot(form, plan), [form, plan])
  const qualityWarnings = useMemo(() => tripQualityWarnings(form, logistics, plan), [form, logistics, plan])
  const tripHealth = useMemo(() => tripHealthSummary(form, logistics, plan, Boolean(activeSavedTrip), checklistDone), [activeSavedTrip, checklistDone, form, logistics, plan])
  const todayCommand = useMemo(() => todayCommandCenter(plan, form.destination, logistics.homeBaseAddress || logistics.homeBaseName), [form.destination, logistics.homeBaseAddress, logistics.homeBaseName, plan])
  const tripComparison = useMemo<TripComparison | null>(() => compareTarget ? compareTrips(currentTrip, compareTarget) : null, [compareTarget, currentTrip])
  const currentShareUrl = useMemo(() => shareUrl(currentTrip), [currentTrip])
  const error = !form.destination.trim() ? 'Destination required.' : days < 1 ? 'End date must be after start date.' : days > 14 ? 'Max 14 days.' : ''

  useEffect(() => {
    const writes = [
      safeWriteStorageJson(localStorage, KEYS.form, form),
      safeWriteStorageJson(localStorage, KEYS.plan, plan),
      safeWriteStorageJson(localStorage, KEYS.logistics, logistics),
      safeWriteStorageJson(localStorage, KEYS.saved, savedTrips),
      safeWriteStorageJson(localStorage, KEYS.ideas, savedIdeas),
      safeWriteStorageJson(localStorage, KEYS.checklist, checklistDone),
    ]
    if (activeTripId) localStorage.setItem(KEYS.active, activeTripId); else localStorage.removeItem(KEYS.active)
    if (writes.some((item) => !item.ok)) console.warn('Tiny Trip local save blocked; export a backup.')
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
  function startFast() {
    const draft = quickStartDraft(form)
    setForm(draft.form)
    setLogistics(draft.logistics)
    setPlan(draft.plan)
    setActiveTripId('')
    setPanel('overview')
    notify('Itinerary created')
  }
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
  function moveActivity(dayId: string, activityId: string, direction: -1 | 1) {
    setPlan((current) => current.map((day) => {
      if (day.id !== dayId) return day
      const index = day.activities.findIndex((activity) => activity.id === activityId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= day.activities.length) return day
      const activities = [...day.activities]
      const [activity] = activities.splice(index, 1)
      activities.splice(target, 0, activity)
      return { ...day, activities }
    }))
  }
  function rewrite(intent: 'relaxed' | 'cheaper' | 'rainy' | 'foodier' | 'family') {
    setPlan((current) => rewriteTripPlan(form, current, intent))
    notify('Trip adjusted')
  }
  function saveIdea(rec: DashboardRecommendation) {
    setSavedIdeas((current) => [savedIdeaFromRecommendation(rec, form.destination), ...current.filter((idea) => idea.title !== rec.title)])
    notify('Saved for later')
  }
  function addSavedIdea(idea: SavedIdea, dayId = ideaTargetDay || plan[0]?.id || '') {
    setPlan((current) => addIdeaToPlanDay(current, idea, dayId, form.destination))
    setSavedIdeas((current) => removeSavedIdea(current, idea.id))
    notify('Idea added')
  }
  function dismissSavedIdea(id: string) {
    setSavedIdeas((current) => removeSavedIdea(current, id))
    notify('Removed saved idea')
  }
  function clearSavedIdeas() {
    setSavedIdeas([])
    notify('Saved ideas cleared')
  }
  function addRecommendation(rec: DashboardRecommendation) {
    setPlan((current) => current.map((day, index) => index === 0 ? { ...day, activities: [...day.activities, { id: `${day.id}-${rec.id}-${Date.now()}`, slot: rec.slot, title: rec.title, note: rec.reason, cost: rec.cost, location: rec.title }] } : day))
    notify('Recommendation added')
  }
  function compareTemplate(template: TripTemplate) {
    const draft = cloneTemplateToDraft(template, form.startDate)
    setCompareTarget(templateToComparableTrip(template, draft.form, draft.logistics, draft.plan))
    setPanel('overview')
    notify('Comparison ready')
  }
  function cloneTemplate(template: TripTemplate) {
    const draft = cloneTemplateToDraft(template, form.startDate)
    const nextForm = draft.form
    setForm(nextForm)
    setLogistics(draft.logistics)
    setPlan(draft.plan)
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

  const primaryConflict = tripHealth.conflicts[0]
  const primaryQuality = qualityWarnings[0]
  const nextStep = primaryConflict
    ? { title: primaryConflict.title, detail: primaryConflict.detail, action: primaryConflict.action }
    : primaryQuality
      ? { title: primaryQuality.title, detail: primaryQuality.detail, action: primaryQuality.id === 'home-base' ? 'Add home base' : primaryQuality.id === 'packed' ? 'Make it easier' : primaryQuality.id === 'food' ? 'Add food' : primaryQuality.id === 'rain' ? 'Add rainy-day options' : 'Review itinerary' }
      : !activeSavedTrip
        ? { title: 'Save this trip', detail: 'Save the itinerary before you travel so it stays easy to restore or share.', action: 'Save trip' }
        : { title: 'Your trip is ready', detail: 'You can share it, print it, or keep adjusting the itinerary.', action: 'Share' }

  function runNextStep(action: string) {
    if (/home base/i.test(action)) setPanel('setup')
    else if (/lighter|easy/i.test(action)) rewrite('relaxed')
    else if (/food/i.test(action)) rewrite('foodier')
    else if (/rain/i.test(action)) rewrite('rainy')
    else if (/save/i.test(action)) saveTrip()
    else if (/share/i.test(action)) setPanel('share')
    else if (/regenerate|create/i.test(action)) generate()
    else setTimelineMode('all')
  }

  return (
    <main className="dashboard-page">
      <aside className="app-sidebar">
        <button className="brand link-button" onClick={() => go('marketing')}><span>✈</span>Tiny Trip</button>
        <div className="sidebar-actions">
          <button aria-current={panel === 'overview' || panel === 'setup' ? 'page' : undefined} className={panel === 'overview' || panel === 'setup' ? 'selected' : ''} onClick={() => setPanel('overview')}>Plan</button>
          <button aria-current={panel === 'explore' ? 'page' : undefined} className={panel === 'explore' ? 'selected' : ''} onClick={() => setPanel('explore')}>Ideas</button>
          <button aria-current={panel === 'saved' ? 'page' : undefined} className={panel === 'saved' ? 'selected' : ''} onClick={() => setPanel('saved')}>Trips <small>{savedTrips.length}</small></button>
          <button aria-current={panel === 'share' ? 'page' : undefined} className={panel === 'share' ? 'selected' : ''} onClick={() => setPanel('share')}>Share</button>
        </div>
        <button className="ghost compact" onClick={() => go('login')}>Log out demo</button>
      </aside>

      <section className="dashboard-main">
        <header className="app-header compact-header">
          <div><p className="eyebrow">Plan</p><h1>{form.destination || 'New trip'}</h1><p>{Math.max(days, 0)} day{days === 1 ? '' : 's'} · {form.travelers} traveler{form.travelers === 1 ? '' : 's'} · {form.pace} · {form.budget}</p></div>
          <div className="header-actions"><button className="primary" onClick={saveTrip}>Save trip</button><button className="ghost" onClick={() => setPanel('share')}>Share</button></div>
        </header>

        <section className="app-grid">
          <aside className="control-card">
            {panel === 'overview' && <div className="panel-stack">
              <h2>Plan</h2>
              <section className="mini-card quick-start-card"><p className="eyebrow">Fast start</p><h3>Plan my trip</h3><p>Create a clean itinerary from the current trip details.</p><div className="button-row"><button className="primary" onClick={startFast}>Create itinerary</button><button onClick={() => setPanel('setup')}>Change trip details</button></div></section>
              <section className="mini-card next-step-card"><div className="mini-card-heading"><h3>Next step</h3><span>{tripHealth.readinessScore}% ready</span></div><p><b>{nextStep.title}</b><br />{nextStep.detail}</p><button className="primary" onClick={() => runNextStep(nextStep.action)}>{nextStep.action}</button><p className="muted">{tripHealth.fixCount} thing{tripHealth.fixCount === 1 ? '' : 's'} to finish.</p></section>
              <section className="mini-card today-card"><div className="mini-card-heading"><h3>{todayCommand.label === 'Today mode' ? 'Today' : todayCommand.label === 'Last planned day' ? 'Last planned day' : 'Next stop'}</h3><button onClick={() => setTimelineMode(todayCommand.label === 'Today mode' ? 'today' : todayCommand.label === 'Last planned day' ? 'all' : 'upcoming')}>{todayCommand.label === 'Last planned day' ? 'Show trip' : 'Show'}</button></div><p><b>{formatDate(todayCommand.date || form.startDate)} · {todayCommand.dayTitle || 'Draft'}</b><br />{todayCommand.detail}</p></section>
              <details className="mini-card"><summary>Readiness details</summary>{readiness.items.map((item) => <p key={item.label} className={item.done ? 'done' : ''}>{item.done ? '✓' : '•'} {item.label}</p>)}</details>
              <details className="mini-card"><summary>Budget</summary><p><b>${budget.dailyLow}–${budget.dailyHigh}</b> / day · <b>${budget.totalLow}–${budget.totalHigh}</b> total</p>{budget.categories.map((cat) => <p key={cat.label}>{cat.label}: ${cat.low}–${cat.high}</p>)}</details>
              <details className="mini-card"><summary>Checklist</summary>{checklist.slice(0, 6).map((item) => <label className="check-row" key={item.id}><input type="checkbox" checked={item.done} onChange={() => toggleChecklist(item.id)} /> <span>{item.label}</span></label>)}</details>
              {tripComparison && <section className="mini-card compare-card"><div className="mini-card-heading"><h3>Compare trips</h3><button className="text-button" onClick={() => setCompareTarget(null)}>Clear</button></div><p><b>{tripComparison.verdict}</b></p><div className="compare-grid"><span></span><b>{tripComparison.leftName}</b><b>{tripComparison.rightName}</b><span>Destination</span><span>{tripComparison.destination[0]}</span><span>{tripComparison.destination[1]}</span><span>Days</span><span>{tripComparison.days[0]}</span><span>{tripComparison.days[1]}</span><span>Readiness</span><span>{tripComparison.readiness[0]}%</span><span>{tripComparison.readiness[1]}%</span></div></section>}
            </div>}
            {panel === 'setup' && <div className="panel-stack">
              <h2>Trip details</h2>
              <label>Destination<input value={form.destination} onChange={(event) => update('destination', event.target.value)} /></label>
              <div className="split"><label>Start<input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label><label>End<input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} /></label></div>
              <div className="split"><label>Travelers<input type="number" min="1" max="12" value={form.travelers} onChange={(event) => update('travelers', Number(event.target.value))} /></label><label>Style<select value={form.pace} onChange={(event) => update('pace', event.target.value as Pace)}><option>Relaxed</option><option>Balanced</option><option>Packed</option></select></label></div>
              <details><summary>Budget and interests</summary><label>Budget<select value={form.budget} onChange={(event) => update('budget', event.target.value as Budget)}><option>Shoestring</option><option>Comfort</option><option>Treat yourself</option></select></label><label>Preset<select onChange={(event) => event.target.value && setForm((current) => applyPreset(current, event.target.value))} defaultValue=""><option value="">Choose a preset...</option>{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.icon} {preset.label}</option>)}</select></label><div className="chips">{interests.map((interest) => <button key={interest} className={form.interests.includes(interest) ? 'selected' : ''} onClick={() => update('interests', form.interests.includes(interest) ? form.interests.filter((item) => item !== interest) : [...form.interests, interest])}>{interest}</button>)}</div></details>
              <details><summary>Stay and notes</summary><label>Home base<input value={logistics.homeBaseName} onChange={(event) => updateLogistics('homeBaseName', event.target.value)} placeholder="Hotel / apartment" /></label><label>Neighborhood<input value={logistics.homeBaseAddress} onChange={(event) => updateLogistics('homeBaseAddress', event.target.value)} /></label><div className="split"><label>Arrival<input value={logistics.arrivalMode} onChange={(event) => updateLogistics('arrivalMode', event.target.value)} placeholder="Flight / train / taxi" /></label><label>Departure<input value={logistics.departureMode} onChange={(event) => updateLogistics('departureMode', event.target.value)} /></label></div><label>Trip notes<textarea value={logistics.importantNotes} onChange={(event) => updateLogistics('importantNotes', event.target.value)} rows={4} placeholder="Reservation codes, dietary notes, reminders…" /></label></details>
              {error && <p className="error">{error}</p>}
              <button className="primary" onClick={generate} disabled={Boolean(error)}>Create itinerary</button>
              <button className="ghost" onClick={() => setPanel('overview')}>Back to plan</button>
            </div>}
            {panel === 'explore' && <div className="panel-stack"><h2>Ideas</h2><section className="mini-card"><h3>Recommended</h3>{recommendations.slice(0, 5).map((rec) => <article className="recommend-row" key={rec.id}><div><b>{rec.title}</b><span>{rec.reason}</span></div><div><button onClick={() => addRecommendation(rec)}>Add</button><button onClick={() => saveIdea(rec)}>Save</button></div></article>)}</section><section className="mini-card"><div className="mini-card-heading"><h3>Saved ideas</h3>{savedIdeaCards.length > 0 && <button className="text-button" onClick={clearSavedIdeas}>Clear all</button>}</div><input placeholder="Search saved ideas" value={ideaSearch} onChange={(event) => setIdeaSearch(event.target.value)} />{visibleIdeas.length === 0 ? <p className="muted">No saved ideas match.</p> : visibleIdeas.map((idea) => <article className="recommend-row" key={idea.id}><div><b>{idea.title}</b><span>{categorizeIdea(idea.tag, idea.title, idea.reason)} · {idea.destination}</span><p>{idea.reason}</p></div><div><button onClick={() => addSavedIdea(idea)}>Add</button><button onClick={() => dismissSavedIdea(idea.id)}>Remove</button></div></article>)}</section><details className="mini-card"><summary>Templates</summary><input placeholder="Search templates" value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} />{visibleTemplates.map((template) => <article className="template-row" key={template.id}><div><b>{template.title}</b><span>{template.destination} · {template.days} days · ★ {template.rating}</span><p>{template.angle}</p></div><button onClick={() => cloneTemplate(template)}>Use</button><button onClick={() => compareTemplate(template)}>Compare</button></article>)}</details></div>}
            {panel === 'saved' && <div className="panel-stack"><h2>Trips</h2><input placeholder="Search trips, cities, interests..." value={tripSearch} onChange={(event) => setTripSearch(event.target.value)} />{visibleSavedTrips.length === 0 ? <p className="muted">No saved trips match.</p> : visibleSavedTrips.map((trip) => <article className="saved-row trip-card" key={trip.id}><strong>{trip.name}</strong><span>{trip.form.destination} · {dayCount(trip.form.startDate, trip.form.endDate)} days</span><div><button onClick={() => loadTrip(trip)}>Open</button><button onClick={() => { setCompareTarget(trip); setPanel('overview') }}>Compare</button><button onClick={() => setSavedTrips((current) => upsertSavedTrip(current, duplicateTrip(trip)))}>Duplicate</button><button onClick={() => setSavedTrips((current) => current.filter((item) => item.id !== trip.id))}>Delete</button></div></article>)}</div>}
            {panel === 'share' && <div className="panel-stack"><h2>Share</h2><p className="muted">Share a clean itinerary, print it, or keep a backup.</p><label>Share link<input readOnly value={currentShareUrl} /></label><button className="primary" onClick={() => navigator.clipboard.writeText(currentShareUrl).then(() => notify('Share link copied'))}>Copy share link</button><button className="ghost" onClick={() => window.open(`/share#trip=${encodeTripForShare(currentTrip)}`, '_blank')}>Open public share view</button><button className="ghost" onClick={() => window.print()}>Print / save PDF</button><button className="ghost" onClick={() => navigator.clipboard.writeText(shareSummary).then(() => notify('Share summary copied'))}>Copy summary</button><button className="ghost" onClick={() => exportFile('md')}>Download Markdown</button><button className="ghost" onClick={() => exportFile('json')}>Download backup</button><button className="ghost" onClick={() => exportFile('ics')}>Download calendar</button><label className="file-button">Restore backup<input hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importTrip(file) }} /></label></div>}
          </aside>

          <section className="itinerary-card">
            <div className="itinerary-toolbar"><div><h2>Itinerary</h2><p>{activeSavedTrip ? `Editing ${activeSavedTrip.name}` : 'Unsaved draft'}</p></div><div><button className="ghost compact" onClick={saveTrip}>Save trip</button><details className="adjust-menu"><summary>Adjust</summary><button onClick={() => rewrite('relaxed')}>Make it easier</button><button onClick={() => rewrite('cheaper')}>Lower the budget</button><button onClick={() => rewrite('rainy')}>Add rainy-day options</button><button onClick={() => rewrite('foodier')}>More food</button><a href={googleIdeasUrl(form)} target="_blank">Get more ideas</a></details><button onClick={() => setPanel('share')}>Share</button></div></div><div className="chips day-filter">{(['all','today','upcoming'] as TimelineMode[]).map((mode) => <button key={mode} className={timelineMode === mode ? 'selected' : ''} onClick={() => setTimelineMode(mode)}>{mode === 'all' ? 'All days' : mode === 'today' ? 'Today' : 'Next stop'}</button>)}</div>
            <div className="day-list">{visiblePlan.map((day) => <article className={`simple-day ${day.status}`} key={day.id}><header><span>Day {day.index + 1}</span><div><h3>{formatDate(day.date)} · {day.title}</h3><p>{day.dontMiss} · {day.estimatedSpend}</p></div></header><div className="intel"><b>Backup:</b> {day.rainyDay}</div>{day.activities.map((activity) => <div className="simple-activity" key={activity.id}><div className="activity-summary"><span>{activity.slot}</span><div><strong>{activity.title}</strong><p>{activity.note}</p></div><em>{activity.cost}</em></div><div className="activity-quick-actions"><a href={googleMapsSearchUrl(form.destination, activity.location || activity.title)} target="_blank">Map</a>{(logistics.homeBaseName || logistics.homeBaseAddress) && <a href={googleDirectionsUrl(logistics.homeBaseAddress || logistics.homeBaseName, activity.location || activity.title)} target="_blank">Directions</a>}<details className="stop-menu"><summary>More</summary><button onClick={() => moveActivity(day.id, activity.id, -1)}>Move up</button><button onClick={() => moveActivity(day.id, activity.id, 1)}>Move down</button><button onClick={() => removeActivity(day.id, activity.id)}>Delete stop</button></details></div><details><summary>Edit</summary><div className="activity-editor"><select value={activity.slot} onChange={(event) => updateActivity(day.id, activity.id, { slot: event.target.value as Slot })}>{slotOrder.map((slot) => <option key={slot}>{slot}</option>)}</select><input value={activity.title} onChange={(event) => updateActivity(day.id, activity.id, { title: event.target.value })} /><select value={activity.cost} onChange={(event) => updateActivity(day.id, activity.id, { cost: event.target.value as Cost })}>{costOptions.map((cost) => <option key={cost}>{cost}</option>)}</select><textarea value={activity.note} onChange={(event) => updateActivity(day.id, activity.id, { note: event.target.value })} rows={2} /></div></details></div>)}<button className="add-line" onClick={() => addActivity(day.id)}>+ Add stop</button></article>)}</div>
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
