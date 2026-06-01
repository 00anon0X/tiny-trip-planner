import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Pace = 'Relaxed' | 'Balanced' | 'Packed'
type Budget = 'Shoestring' | 'Comfort' | 'Treat yourself'
type Slot = 'Morning' | 'Afternoon' | 'Evening' | 'Flex'

type TripForm = {
  destination: string
  startDate: string
  endDate: string
  travelers: number
  pace: Pace
  budget: Budget
  interests: string[]
}

type Activity = {
  id: string
  slot: Slot
  title: string
  note: string
  cost: '$' | '$$' | '$$$'
}

type DayPlan = {
  id: string
  date: string
  title: string
  summary: string
  activities: Activity[]
}

const interests = ['Food', 'Culture', 'Outdoors', 'Hidden gems', 'Shopping', 'Nightlife', 'Family']

const travelPhotos = [
  {
    city: 'Lisbon',
    label: 'Alfama morning light',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Alfama%2C_Lisbon_%28DSC03367%29.jpg/1280px-Alfama%2C_Lisbon_%28DSC03367%29.jpg',
  },
  {
    city: 'Kyoto',
    label: 'temple paths and quiet streets',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-01.jpg/1280px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-01.jpg',
  },
  {
    city: 'Seoul',
    label: 'neon dinner streets',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Myeongdong_night_market_seoul_1.jpg/1280px-Myeongdong_night_market_seoul_1.jpg',
  },
]

const destinationPhotoSets: Record<string, string[]> = {
  lisbon: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Alfama%2C_Lisbon_%28DSC03367%29.jpg/1280px-Alfama%2C_Lisbon_%28DSC03367%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alfama%2C_Lisbon_%28DSC03371%29.jpg/1280px-Alfama%2C_Lisbon_%28DSC03371%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Lissabon_-_Alfama_-_Largo_Santa_Luzia_6.jpg/1280px-Lissabon_-_Alfama_-_Largo_Santa_Luzia_6.jpg',
  ],
  kyoto: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-01.jpg/1280px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-01.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg/1280px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-06.jpg/1280px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-06.jpg',
  ],
  seoul: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Myeongdong_night_market_seoul_1.jpg/1280px-Myeongdong_night_market_seoul_1.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Myeongdong_night_market_seoul_2.jpg/1280px-Myeongdong_night_market_seoul_2.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Namdaemun-ro_and_Aloft_Seoul_Myeongdong_by_night.jpg/1280px-Namdaemun-ro_and_Aloft_Seoul_Myeongdong_by_night.jpg',
  ],
}

function photosForDestination(destination: string) {
  const normalized = destination.toLowerCase()
  const key = Object.keys(destinationPhotoSets).find((city) => normalized.includes(city))
  return key ? destinationPhotoSets[key] : travelPhotos.map((photo) => photo.url)
}

function photoForDestination(destination: string) {
  const normalized = destination.toLowerCase()
  return travelPhotos.find((photo) => normalized.includes(photo.city.toLowerCase())) ?? travelPhotos[0]
}

const sampleTrip: TripForm = {
  destination: 'Lisbon',
  startDate: '2026-07-10',
  endDate: '2026-07-12',
  travelers: 2,
  pace: 'Balanced',
  budget: 'Comfort',
  interests: ['Food', 'Culture', 'Outdoors'],
}

const activityBank: Record<string, Omit<Activity, 'id' | 'slot'>[]> = {
  Food: [
    { title: 'Neighborhood breakfast crawl', note: 'Start with a local bakery, coffee, and one signature pastry.', cost: '$' },
    { title: 'Market lunch stop', note: 'Pick a central market and let everyone choose one small plate.', cost: '$$' },
    { title: 'Low-key dinner reservation', note: 'Book a casual local favorite near your stay to avoid a tired commute.', cost: '$$' },
    { title: 'Dessert walk', note: 'Take a short post-dinner loop and try the local sweet thing.', cost: '$' },
  ],
  Culture: [
    { title: 'Old town orientation walk', note: 'Use the first hour to understand the main squares and transit stops.', cost: '$' },
    { title: 'One anchor museum or landmark', note: 'Choose one must-see and buy timed tickets if queues are common.', cost: '$$' },
    { title: 'Architecture photo route', note: 'Save three buildings or viewpoints and connect them on foot.', cost: '$' },
    { title: 'Small gallery or bookstore stop', note: 'Add a quiet indoor break that still feels specific to the city.', cost: '$' },
  ],
  Outdoors: [
    { title: 'Scenic viewpoint loop', note: 'Go early or late for softer light and fewer crowds.', cost: '$' },
    { title: 'Waterfront or park reset', note: 'Keep this flexible so bad weather does not break the day.', cost: '$' },
    { title: 'Golden-hour walk', note: 'Choose a safe, easy route ending near dinner.', cost: '$' },
    { title: 'Picnic buffer', note: 'Grab snacks and use this as a cheap rest block.', cost: '$' },
  ],
  'Hidden gems': [
    { title: 'Side-street neighborhood wander', note: 'Pick one district away from the obvious tourist core.', cost: '$' },
    { title: 'Tiny specialty shop stop', note: 'Find one maker, record store, ceramic shop, or local studio.', cost: '$$' },
    { title: 'Quiet courtyard break', note: 'Useful when the group needs a reset but not a hotel nap.', cost: '$' },
  ],
  Shopping: [
    { title: 'Local design shops', note: 'Set a timebox so shopping does not consume the day.', cost: '$$' },
    { title: 'Souvenir pass', note: 'Buy small, packable things near the end of the trip.', cost: '$$' },
    { title: 'Vintage or flea-market browse', note: 'Best paired with a nearby café break.', cost: '$' },
  ],
  Nightlife: [
    { title: 'Sunset drinks', note: 'Choose one scenic bar and keep the rest of the night optional.', cost: '$$' },
    { title: 'Live music check', note: 'Look for a small venue with no complicated dress code.', cost: '$$' },
    { title: 'Late-night snack route', note: 'Anchor the night with food so it does not become random wandering.', cost: '$' },
  ],
  Family: [
    { title: 'Easy hands-on stop', note: 'Pick something tactile: aquarium, science museum, playground, or boat ride.', cost: '$$' },
    { title: 'Early dinner window', note: 'Reserve a predictable place before everyone gets tired.', cost: '$$' },
    { title: 'Hotel reset block', note: 'Protect one hour for showers, naps, and charging devices.', cost: '$' },
  ],
  General: [
    { title: 'Arrival buffer', note: 'Check in, drop bags, buy water, and learn the nearest transit stop.', cost: '$' },
    { title: 'Flexible free block', note: 'Keep this open for weather, delays, or a recommendation from a local.', cost: '$' },
    { title: 'Departure prep', note: 'Pack, confirm transport, and leave a margin for airport or train timing.', cost: '$' },
  ],
}

const slotOrder: Slot[] = ['Morning', 'Afternoon', 'Evening', 'Flex']

function hashText(text: string) {
  return [...text].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function isoAdd(start: string, offset: number) {
  const date = new Date(`${start}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function dayCount(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`).getTime()
  const end = new Date(`${endDate}T12:00:00`).getTime()
  return Math.floor((end - start) / 86_400_000) + 1
}

function itineraryMarkdown(form: TripForm, plan: DayPlan[]) {
  return `# ${form.destination || 'Tiny'} Trip Plan\n\n${form.startDate} → ${form.endDate} · ${form.travelers} traveler${form.travelers === 1 ? '' : 's'} · ${form.pace} pace · ${form.budget} budget\n\n${plan
    .map(
      (day, index) =>
        `## Day ${index + 1} — ${formatDate(day.date)} — ${day.title}\n${day.summary}\n\n${day.activities
          .map((activity) => `- **${activity.slot}: ${activity.title}** (${activity.cost}) — ${activity.note}`)
          .join('\n')}`,
    )
    .join('\n\n')}\n\n## Tiny packing list\n- Passport / ID and booking confirmations\n- Comfortable walking shoes\n- Portable charger\n- Weather layer\n- Small day bag\n\nGenerated by Tiny Trip Planner.`
}

function generatePlan(form: TripForm): DayPlan[] {
  const days = Math.min(Math.max(dayCount(form.startDate, form.endDate), 1), 14)
  const pickedInterests = form.interests.length ? form.interests : ['General']
  const perDay = form.pace === 'Relaxed' ? 2 : form.pace === 'Packed' ? 4 : 3
  const seed = hashText(JSON.stringify(form))

  return Array.from({ length: days }, (_, dayIndex) => {
    const date = isoAdd(form.startDate, dayIndex)
    const daySeed = seed + dayIndex * 97
    const title = dayIndex === 0 ? 'Arrival & first look' : dayIndex === days - 1 ? 'Slow finish & favorites' : `${pickedInterests[dayIndex % pickedInterests.length]} day`
    const activities: Activity[] = Array.from({ length: perDay }, (_, activityIndex) => {
      const slot = slotOrder[activityIndex] ?? 'Flex'
      const interest = pickedInterests[(dayIndex + activityIndex) % pickedInterests.length]
      const bank = activityBank[interest] ?? activityBank.General
      const template = bank[(daySeed + activityIndex * 13) % bank.length]
      return {
        ...template,
        id: `${date}-${activityIndex}-${hashText(template.title)}`,
        slot,
      }
    })

    if (dayIndex === 0) {
      activities[0] = { id: `${date}-arrival`, slot: 'Morning', title: 'Arrival buffer', note: `Land in ${form.destination || 'your destination'}, drop bags, and keep the first block deliberately easy.`, cost: '$' }
    }
    if (dayIndex === days - 1) {
      activities[activities.length - 1] = { id: `${date}-departure`, slot: activities.length > 3 ? 'Flex' : 'Evening', title: 'Departure prep', note: 'Pack, confirm transport, and protect a final no-rush buffer.', cost: '$' }
    }

    return {
      id: date,
      date,
      title,
      summary: `${form.pace} ${form.budget.toLowerCase()} day in ${form.destination || 'your destination'} with ${activities.length} practical stops.`,
      activities,
    }
  })
}

function App() {
  const [form, setForm] = useState<TripForm>(() => {
    try {
      const saved = localStorage.getItem('tinytrip:form')
      return saved ? JSON.parse(saved) : sampleTrip
    } catch {
      return sampleTrip
    }
  })
  const [plan, setPlan] = useState<DayPlan[]>(() => {
    try {
      const saved = localStorage.getItem('tinytrip:plan')
      return saved ? JSON.parse(saved) : generatePlan(sampleTrip)
    } catch {
      return generatePlan(sampleTrip)
    }
  })
  const [copied, setCopied] = useState(false)
  const activePhoto = photoForDestination(form.destination)
  const dayPhotos = photosForDestination(form.destination)

  const days = useMemo(() => dayCount(form.startDate, form.endDate), [form.startDate, form.endDate])
  const error = !form.destination.trim()
    ? 'Add a destination to generate a useful plan.'
    : days < 1
      ? 'End date must be after the start date.'
      : days > 14
        ? 'Tiny Trip Planner supports trips up to 14 days.'
        : ''

  useEffect(() => {
    try {
      localStorage.setItem('tinytrip:form', JSON.stringify(form))
      localStorage.setItem('tinytrip:plan', JSON.stringify(plan))
    } catch {
      // App still works without persistence.
    }
  }, [form, plan])

  function update<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleInterest(interest: string) {
    update('interests', form.interests.includes(interest) ? form.interests.filter((item) => item !== interest) : [...form.interests, interest])
  }

  function generate() {
    if (!error) setPlan(generatePlan(form))
  }

  function updateActivity(dayId: string, activityId: string, patch: Partial<Activity>) {
    setPlan((current) =>
      current.map((day) =>
        day.id === dayId
          ? { ...day, activities: day.activities.map((activity) => (activity.id === activityId ? { ...activity, ...patch } : activity)) }
          : day,
      ),
    )
  }

  function moveActivity(dayId: string, activityId: string, direction: -1 | 1) {
    setPlan((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day
        const index = day.activities.findIndex((activity) => activity.id === activityId)
        const target = index + direction
        if (target < 0 || target >= day.activities.length) return day
        const activities = [...day.activities]
        const [item] = activities.splice(index, 1)
        activities.splice(target, 0, item)
        return { ...day, activities }
      }),
    )
  }

  function addActivity(dayId: string) {
    setPlan((current) =>
      current.map((day) =>
        day.id === dayId
          ? {
              ...day,
              activities: [
                ...day.activities,
                { id: `${day.id}-${Date.now()}`, slot: 'Flex', title: 'New plan item', note: 'Add details, timing, or backup notes here.', cost: '$$' },
              ],
            }
          : day,
      ),
    )
  }

  function deleteActivity(dayId: string, activityId: string) {
    setPlan((current) => current.map((day) => (day.id === dayId ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) } : day)))
  }

  async function copyPlan() {
    await navigator.clipboard.writeText(itineraryMarkdown(form, plan))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function downloadPlan() {
    const blob = new Blob([itineraryMarkdown(form, plan)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${form.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'tiny-trip'}-plan.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Tiny Trip Planner home">
          <span>✈</span>
          Tiny Trip
        </a>
        <div className="nav-links">
          <a href="#planner">Planner</a>
          <a href="#itinerary">Itinerary</a>
          <a href="#packing">Packing</a>
        </div>
        <button type="button" className="ghost" onClick={() => window.print()}>Print</button>
      </nav>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">Browser-only tiny trip planner</p>
          <h1>Plan a useful little itinerary in under a minute.</h1>
          <p className="hero-copy">No login, no API keys, no pretend AI. Pick a destination, dates, and vibe — get a clean day-by-day plan you can edit, copy, print, or save.</p>
          <div className="hero-actions">
            <a className="primary-link" href="#planner">Plan my trip</a>
            <button type="button" className="ghost" onClick={() => { setForm(sampleTrip); setPlan(generatePlan(sampleTrip)) }}>Load Lisbon sample</button>
          </div>
        </div>
        <aside className="hero-card photo-card" aria-label="Trip preview">
          <img src={activePhoto.url} alt={`${activePhoto.city} travel inspiration`} />
          <div className="photo-overlay">
            <span className="pin">📍 {activePhoto.label}</span>
            <strong>{form.destination || 'Your destination'}</strong>
            <p>{Math.max(days, 0)} day{days === 1 ? '' : 's'} · {form.travelers} traveler{form.travelers === 1 ? '' : 's'} · {form.pace}</p>
          </div>
        </aside>
      </section>

      <section className="photo-strip" aria-label="Travel inspiration photos">
        {travelPhotos.map((photo) => (
          <article key={photo.city}>
            <img src={photo.url} alt={`${photo.city} inspiration`} loading="lazy" />
            <div>
              <span>{photo.city}</span>
              <p>{photo.label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="workspace" id="planner">
        <form className="panel controls" onSubmit={(event) => { event.preventDefault(); generate() }}>
          <div className="section-heading">
            <span>01 / Trip inputs</span>
            <h2>Tell it just enough.</h2>
          </div>

          <label>Destination
            <input value={form.destination} onChange={(event) => update('destination', event.target.value)} placeholder="Tokyo, Seoul, Lisbon..." />
          </label>
          <div className="two-col">
            <label>Start date
              <input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} />
            </label>
            <label>End date
              <input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} />
            </label>
          </div>
          <div className="two-col">
            <label>Travelers
              <input type="number" min="1" max="12" value={form.travelers} onChange={(event) => update('travelers', Number(event.target.value))} />
            </label>
            <label>Budget
              <select value={form.budget} onChange={(event) => update('budget', event.target.value as Budget)}>
                <option>Shoestring</option>
                <option>Comfort</option>
                <option>Treat yourself</option>
              </select>
            </label>
          </div>

          <fieldset>
            <legend>Pace</legend>
            <div className="chip-row">
              {(['Relaxed', 'Balanced', 'Packed'] as Pace[]).map((pace) => (
                <button key={pace} type="button" className={form.pace === pace ? 'chip selected' : 'chip'} onClick={() => update('pace', pace)}>{pace}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Interests</legend>
            <div className="chip-row interests">
              {interests.map((interest) => (
                <button key={interest} type="button" className={form.interests.includes(interest) ? 'chip selected' : 'chip'} onClick={() => toggleInterest(interest)}>{interest}</button>
              ))}
            </div>
          </fieldset>

          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={Boolean(error)} type="submit">Generate itinerary</button>
        </form>

        <section className="panel output" id="itinerary">
          <div className="output-toolbar">
            <div className="section-heading">
              <span>02 / Editable itinerary</span>
              <h2>{form.destination || 'Tiny'} in {Math.max(days, 0)} day{days === 1 ? '' : 's'}</h2>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="ghost" onClick={copyPlan}>{copied ? 'Copied!' : 'Copy'}</button>
              <button type="button" className="ghost" onClick={downloadPlan}>Download</button>
            </div>
          </div>

          <div className="day-stack">
            {plan.map((day, dayIndex) => (
              <article className="day-card" key={day.id}>
                <div className="day-photo" style={{ backgroundImage: `url(${dayPhotos[dayIndex % dayPhotos.length]})` }} />
                <header>
                  <span className="day-number">Day {dayIndex + 1}</span>
                  <div>
                    <h3>{formatDate(day.date)} · {day.title}</h3>
                    <p>{day.summary}</p>
                  </div>
                </header>
                <div className="timeline">
                  {day.activities.length === 0 ? <p className="empty">No activities yet. Add one below.</p> : day.activities.map((activity, activityIndex) => (
                    <div className="activity" key={activity.id}>
                      <select aria-label="Activity time slot" value={activity.slot} onChange={(event) => updateActivity(day.id, activity.id, { slot: event.target.value as Slot })}>
                        {slotOrder.map((slot) => <option key={slot}>{slot}</option>)}
                      </select>
                      <input aria-label="Activity title" value={activity.title} onChange={(event) => updateActivity(day.id, activity.id, { title: event.target.value })} />
                      <textarea aria-label="Activity note" rows={2} value={activity.note} onChange={(event) => updateActivity(day.id, activity.id, { note: event.target.value })} />
                      <div className="activity-actions">
                        <span>Cost {activity.cost}</span>
                        <button type="button" onClick={() => moveActivity(day.id, activity.id, -1)} disabled={activityIndex === 0}>↑</button>
                        <button type="button" onClick={() => moveActivity(day.id, activity.id, 1)} disabled={activityIndex === day.activities.length - 1}>↓</button>
                        <button type="button" onClick={() => deleteActivity(day.id, activity.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="add" type="button" onClick={() => addActivity(day.id)}>+ Add activity</button>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="extras" id="packing">
        <article className="image-extra packing-extra">
          <span>🎒</span>
          <h3>Tiny packing list</h3>
          <ul>
            <li>Passport / ID + bookings</li>
            <li>Comfortable shoes</li>
            <li>Portable charger</li>
            <li>Weather layer</li>
          </ul>
        </article>
        <article className="image-extra budget-extra">
          <span>💸</span>
          <h3>Budget guardrail</h3>
          <p>{form.budget === 'Shoestring' ? 'Prioritize markets, transit, and free viewpoints.' : form.budget === 'Comfort' ? 'Mix paid anchors with low-cost wandering blocks.' : 'Book one memorable meal or guided activity early.'}</p>
        </article>
        <article className="image-extra map-extra">
          <span>🗺️</span>
          <h3>Useful links</h3>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(form.destination)}`} target="_blank">Open map search</a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(`${form.destination} best neighborhoods food culture itinerary`)}`} target="_blank">Search ideas</a>
        </article>
      </section>
    </main>
  )
}

export default App
