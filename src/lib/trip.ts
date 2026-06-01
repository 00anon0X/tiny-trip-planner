export type Pace = 'Relaxed' | 'Balanced' | 'Packed'
export type Budget = 'Shoestring' | 'Comfort' | 'Treat yourself'
export type Slot = 'Morning' | 'Afternoon' | 'Evening' | 'Flex'
export type Cost = 'Free' | '$' | '$$' | '$$$' | 'Prepaid'

export type TripForm = {
  destination: string
  startDate: string
  endDate: string
  travelers: number
  pace: Pace
  budget: Budget
  interests: string[]
}

export type TripLogistics = {
  homeBaseName: string
  homeBaseAddress: string
  arrivalMode: string
  departureMode: string
  checkInTime: string
  checkOutTime: string
  importantNotes: string
}

export type Activity = {
  id: string
  slot: Slot
  title: string
  note: string
  cost: Cost
  location?: string
  backup?: string
}

export type DayPlan = {
  id: string
  date: string
  title: string
  summary: string
  activities: Activity[]
  rainyDay: string
  dontMiss: string
  transitNote: string
  estimatedSpend: string
}

export type SavedTrip = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  form: TripForm
  logistics: TripLogistics
  plan: DayPlan[]
}

export type TripPreset = {
  id: string
  label: string
  description: string
  icon: string
  patch: Partial<TripForm>
}

export const interests = ['Food', 'Culture', 'Outdoors', 'Hidden gems', 'Shopping', 'Nightlife', 'Family']
export const slotOrder: Slot[] = ['Morning', 'Afternoon', 'Evening', 'Flex']
export const costOptions: Cost[] = ['Free', '$', '$$', '$$$', 'Prepaid']

export const sampleTrip: TripForm = {
  destination: 'Lisbon',
  startDate: '2026-07-10',
  endDate: '2026-07-12',
  travelers: 2,
  pace: 'Balanced',
  budget: 'Comfort',
  interests: ['Food', 'Culture', 'Outdoors'],
}

export const emptyLogistics: TripLogistics = {
  homeBaseName: '',
  homeBaseAddress: '',
  arrivalMode: '',
  departureMode: '',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  importantNotes: '',
}

export const travelPhotos = [
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
    travelPhotos[0].url,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Alfama%2C_Lisbon_%28DSC03371%29.jpg/1280px-Alfama%2C_Lisbon_%28DSC03371%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Lissabon_-_Alfama_-_Largo_Santa_Luzia_6.jpg/1280px-Lissabon_-_Alfama_-_Largo_Santa_Luzia_6.jpg',
  ],
  kyoto: [
    travelPhotos[1].url,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg/1280px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-02.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-06.jpg/1280px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-06.jpg',
  ],
  seoul: [
    travelPhotos[2].url,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Myeongdong_night_market_seoul_2.jpg/1280px-Myeongdong_night_market_seoul_2.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Namdaemun-ro_and_Aloft_Seoul_Myeongdong_by_night.jpg/1280px-Namdaemun-ro_and_Aloft_Seoul_Myeongdong_by_night.jpg',
  ],
}

export const presets: TripPreset[] = [
  { id: 'weekend-city', label: 'Weekend city break', description: 'Food, culture, hidden gems. Balanced but not frantic.', icon: '🌆', patch: { pace: 'Balanced', budget: 'Comfort', interests: ['Food', 'Culture', 'Hidden gems'] } },
  { id: 'family-easy', label: 'Family easy mode', description: 'Late starts, parks, hands-on stops, protected resets.', icon: '🧸', patch: { pace: 'Relaxed', budget: 'Comfort', interests: ['Family', 'Outdoors', 'Food'] } },
  { id: 'food-first', label: 'Food crawl', description: 'Markets, local favorites, dessert walks, nightlife snacks.', icon: '🍜', patch: { pace: 'Packed', budget: 'Comfort', interests: ['Food', 'Hidden gems', 'Nightlife'] } },
  { id: 'shoestring', label: 'Shoestring explorer', description: 'Free viewpoints, markets, walking routes, public transit.', icon: '🎒', patch: { pace: 'Balanced', budget: 'Shoestring', interests: ['Outdoors', 'Culture', 'Hidden gems'] } },
  { id: 'treat-yourself', label: 'Treat-yourself escape', description: 'One memorable anchor daily with elegant buffers.', icon: '🥂', patch: { pace: 'Relaxed', budget: 'Treat yourself', interests: ['Food', 'Shopping', 'Culture'] } },
  { id: 'rainy-day', label: 'Rainy-day proof', description: 'Indoor anchors and flexible backup ideas.', icon: '☔', patch: { pace: 'Relaxed', budget: 'Comfort', interests: ['Culture', 'Food', 'Shopping'] } },
]

const activityBank: Record<string, Omit<Activity, 'id' | 'slot'>[]> = {
  Food: [
    { title: 'Neighborhood breakfast crawl', note: 'Start with a local bakery, coffee, and one signature pastry.', cost: '$', location: 'local bakery', backup: 'hotel café and a short pastry run' },
    { title: 'Market lunch stop', note: 'Pick a central market and let everyone choose one small plate.', cost: '$$', location: 'central food market', backup: 'covered food hall' },
    { title: 'Low-key dinner reservation', note: 'Book a casual local favorite near your stay to avoid a tired commute.', cost: '$$', location: 'restaurant near home base', backup: 'nearby no-reservation bistro' },
    { title: 'Dessert walk', note: 'Take a short post-dinner loop and try the local sweet thing.', cost: '$', location: 'dessert shop', backup: 'takeaway dessert' },
  ],
  Culture: [
    { title: 'Old town orientation walk', note: 'Use the first hour to understand the main squares and transit stops.', cost: 'Free', location: 'old town', backup: 'self-guided indoor arcade route' },
    { title: 'One anchor museum or landmark', note: 'Choose one must-see and buy timed tickets if queues are common.', cost: '$$', location: 'main landmark', backup: 'smaller nearby museum' },
    { title: 'Architecture photo route', note: 'Save three buildings or viewpoints and connect them on foot.', cost: 'Free', location: 'photo route', backup: 'covered viewpoint café' },
    { title: 'Small gallery or bookstore stop', note: 'Add a quiet indoor break that still feels specific to the city.', cost: '$', location: 'gallery district', backup: 'local bookstore' },
  ],
  Outdoors: [
    { title: 'Scenic viewpoint loop', note: 'Go early or late for softer light and fewer crowds.', cost: 'Free', location: 'viewpoint', backup: 'window-seat café' },
    { title: 'Waterfront or park reset', note: 'Keep this flexible so bad weather does not break the day.', cost: 'Free', location: 'waterfront park', backup: 'covered market stroll' },
    { title: 'Golden-hour walk', note: 'Choose a safe, easy route ending near dinner.', cost: 'Free', location: 'scenic walk', backup: 'short taxi to dinner' },
    { title: 'Picnic buffer', note: 'Grab snacks and use this as a cheap rest block.', cost: '$', location: 'park', backup: 'bakery bench break' },
  ],
  'Hidden gems': [
    { title: 'Side-street neighborhood wander', note: 'Pick one district away from the obvious tourist core.', cost: 'Free', location: 'quiet neighborhood', backup: 'local café crawl' },
    { title: 'Tiny specialty shop stop', note: 'Find one maker, record store, ceramic shop, or local studio.', cost: '$$', location: 'specialty shop', backup: 'covered design shop' },
    { title: 'Quiet courtyard break', note: 'Useful when the group needs a reset but not a hotel nap.', cost: 'Free', location: 'courtyard', backup: 'library or lobby lounge' },
  ],
  Shopping: [
    { title: 'Local design shops', note: 'Set a timebox so shopping does not consume the day.', cost: '$$', location: 'design district', backup: 'department store' },
    { title: 'Souvenir pass', note: 'Buy small, packable things near the end of the trip.', cost: '$$', location: 'souvenir street', backup: 'museum shop' },
    { title: 'Vintage or flea-market browse', note: 'Best paired with a nearby café break.', cost: '$', location: 'flea market', backup: 'indoor vintage mall' },
  ],
  Nightlife: [
    { title: 'Sunset drinks', note: 'Choose one scenic bar and keep the rest of the night optional.', cost: '$$', location: 'rooftop or riverside bar', backup: 'cozy wine bar' },
    { title: 'Live music check', note: 'Look for a small venue with no complicated dress code.', cost: '$$', location: 'live venue', backup: 'low-key listening bar' },
    { title: 'Late-night snack route', note: 'Anchor the night with food so it does not become random wandering.', cost: '$', location: 'late-night food street', backup: 'takeaway snack near stay' },
  ],
  Family: [
    { title: 'Easy hands-on stop', note: 'Pick something tactile: aquarium, science museum, playground, or boat ride.', cost: '$$', location: 'family attraction', backup: 'indoor play stop' },
    { title: 'Early dinner window', note: 'Reserve a predictable place before everyone gets tired.', cost: '$$', location: 'family restaurant', backup: 'takeaway near home base' },
    { title: 'Hotel reset block', note: 'Protect one hour for showers, naps, and charging devices.', cost: 'Free', location: 'home base', backup: 'quiet café reset' },
  ],
  General: [
    { title: 'Arrival buffer', note: 'Check in, drop bags, buy water, and learn the nearest transit stop.', cost: 'Free', location: 'home base', backup: 'luggage storage nearby' },
    { title: 'Flexible free block', note: 'Keep this open for weather, delays, or a recommendation from a local.', cost: 'Free', location: 'nearby', backup: 'indoor café' },
    { title: 'Departure prep', note: 'Pack, confirm transport, and leave a margin for airport or train timing.', cost: 'Free', location: 'home base', backup: 'earlier transfer' },
  ],
}

export function safeReadJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function hashText(text: string) {
  return [...text].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

export function isoAdd(start: string, offset: number) {
  const date = new Date(`${start}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function dayCount(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`).getTime()
  const end = new Date(`${endDate}T12:00:00`).getTime()
  return Math.floor((end - start) / 86_400_000) + 1
}

export function photosForDestination(destination: string) {
  const normalized = destination.toLowerCase()
  const key = Object.keys(destinationPhotoSets).find((city) => normalized.includes(city))
  return key ? destinationPhotoSets[key] : travelPhotos.map((photo) => photo.url)
}

export function photoForDestination(destination: string) {
  const normalized = destination.toLowerCase()
  return travelPhotos.find((photo) => normalized.includes(photo.city.toLowerCase())) ?? travelPhotos[0]
}

export function applyPreset(form: TripForm, presetId: string) {
  const preset = presets.find((item) => item.id === presetId)
  return preset ? { ...form, ...preset.patch, destination: form.destination, startDate: form.startDate, endDate: form.endDate } : form
}

function spendForBudget(budget: Budget) {
  if (budget === 'Shoestring') return '$25–60 / person'
  if (budget === 'Treat yourself') return '$160+ / person'
  return '$70–150 / person'
}

export function generatePlan(form: TripForm): DayPlan[] {
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
      return { ...template, id: `${date}-${activityIndex}-${hashText(template.title)}`, slot }
    })

    if (dayIndex === 0) activities[0] = { id: `${date}-arrival`, slot: 'Morning', title: 'Arrival buffer', note: `Land in ${form.destination || 'your destination'}, drop bags, and keep the first block deliberately easy.`, cost: 'Free', location: 'home base', backup: 'luggage storage nearby' }
    if (dayIndex === days - 1) activities[activities.length - 1] = { id: `${date}-departure`, slot: activities.length > 3 ? 'Flex' : 'Evening', title: 'Departure prep', note: 'Pack, confirm transport, and protect a final no-rush buffer.', cost: 'Free', location: 'home base', backup: 'earlier transfer' }

    const warning = form.pace === 'Packed' ? ' This is a busy day — cut one stop if transit feels slow.' : ''
    return {
      id: date,
      date,
      title,
      summary: `${form.pace} ${form.budget.toLowerCase()} day in ${form.destination || 'your destination'} with ${activities.length} practical stops.${warning}`,
      activities,
      rainyDay: activities.find((activity) => activity.backup)?.backup ?? 'covered café and one indoor anchor',
      dontMiss: activities[1]?.title ?? activities[0]?.title ?? 'one local anchor',
      transitNote: form.pace === 'Packed' ? 'Cluster stops by neighborhood; do not zig-zag.' : 'Keep one main transit hop and walk the rest where possible.',
      estimatedSpend: spendForBudget(form.budget),
    }
  })
}

export function makeSavedTrip(form: TripForm, logistics: TripLogistics, plan: DayPlan[], existing?: Partial<SavedTrip>): SavedTrip {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? `trip-${Date.now()}-${hashText(form.destination + form.startDate)}`,
    name: existing?.name ?? `${form.destination || 'Tiny'} trip`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    form,
    logistics,
    plan,
  }
}

export function upsertSavedTrip(trips: SavedTrip[], trip: SavedTrip) {
  const rest = trips.filter((item) => item.id !== trip.id)
  return [trip, ...rest].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function duplicateTrip(trip: SavedTrip) {
  return makeSavedTrip(trip.form, trip.logistics, trip.plan, { name: `${trip.name} copy` })
}

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tiny-trip'
}

export function googleMapsSearchUrl(destination: string, query?: string) {
  const q = query ? `${query} ${destination}` : destination
  return `https://www.google.com/maps/search/${encodeURIComponent(q).replace(/%20/g, '+')}`
}

export function googleDirectionsUrl(from: string, to: string) {
  if (!from.trim()) return googleMapsSearchUrl(to)
  return `https://www.google.com/maps/dir/${encodeURIComponent(from).replace(/%20/g, '+')}/${encodeURIComponent(to).replace(/%20/g, '+')}`
}

export function googleIdeasUrl(form: TripForm) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${form.destination} ${form.interests.join(' ')} itinerary neighborhoods food culture`)}`
}

export function tripToMarkdown(trip: SavedTrip) {
  const { form, logistics, plan } = trip
  const logisticsLines = [
    logistics.homeBaseName && `- Home base: ${logistics.homeBaseName}`,
    logistics.homeBaseAddress && `- Address: ${logistics.homeBaseAddress}`,
    logistics.checkInTime && `- Check-in: ${logistics.checkInTime}`,
    logistics.checkOutTime && `- Check-out: ${logistics.checkOutTime}`,
    logistics.arrivalMode && `- Arrival: ${logistics.arrivalMode}`,
    logistics.departureMode && `- Departure: ${logistics.departureMode}`,
    logistics.importantNotes && `- Notes: ${logistics.importantNotes}`,
  ].filter(Boolean).join('\n') || '- Add your stay, transport, and notes.'

  return `# ${form.destination || 'Tiny'} Trip Plan\n\n${form.startDate} → ${form.endDate} · ${form.travelers} traveler${form.travelers === 1 ? '' : 's'} · ${form.pace} pace · ${form.budget} budget\n\n## Logistics\n${logisticsLines}\n\n${plan.map((day, index) => `## Day ${index + 1} — ${formatDate(day.date)} — ${day.title}\n${day.summary}\n\nDon't miss: ${day.dontMiss}\nTransit: ${day.transitNote}\nSpend: ${day.estimatedSpend}\nRainy-day backup: ${day.rainyDay}\n\n${day.activities.map((activity) => `- **${activity.slot}: ${activity.title}** (${activity.cost}) — ${activity.note}${activity.location ? ` · ${activity.location}` : ''}`).join('\n')}`).join('\n\n')}\n\n## Rainy-day backups\n${plan.map((day, index) => `- Day ${index + 1}: ${day.rainyDay}`).join('\n')}\n\n## Tiny packing list\n- Passport / ID and booking confirmations\n- Comfortable walking shoes\n- Portable charger\n- Weather layer\n- Small day bag\n\nGenerated by Tiny Trip Planner.`
}

function icsDate(date: string, hour: string) {
  return `${date.replaceAll('-', '')}T${hour}0000`
}

function escapeIcs(text: string) {
  return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n')
}

export function tripToIcs(trip: SavedTrip) {
  const slotTimes: Record<Slot, string> = { Morning: '0900', Afternoon: '1300', Evening: '1800', Flex: '1500' }
  const events = trip.plan.flatMap((day) => day.activities.map((activity) => `BEGIN:VEVENT\nUID:${activity.id}@tinytrip\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\nDTSTART:${icsDate(day.date, slotTimes[activity.slot])}\nDURATION:PT90M\nSUMMARY:${escapeIcs(activity.title)}\nDESCRIPTION:${escapeIcs(activity.note)}\nLOCATION:${escapeIcs(activity.location || trip.form.destination)}\nEND:VEVENT`))
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Tiny Trip Planner//EN\n${events.join('\n')}\nEND:VCALENDAR`
}

export function tripToJson(trip: SavedTrip) {
  return JSON.stringify(trip, null, 2)
}

export function parseImportedTrip(raw: string): SavedTrip | null {
  const value = safeReadJson<SavedTrip | null>(raw, null)
  if (!value?.form?.destination || !Array.isArray(value.plan)) return null
  return value
}
