import {
  dayCount,
  emptyLogistics,
  formatDate,
  generatePlan,
  hashText,
  isoAdd,
  makeSavedTrip,
  type Activity,
  type Budget,
  type Cost,
  type DayPlan,
  type Pace,
  type SavedTrip,
  type Slot,
  type TripForm,
  type TripLogistics,
} from './trip'
import type { SavedIdea } from './sprint'

export type IdeaCategory = 'Food' | 'Culture' | 'Outdoors' | 'Shopping' | 'Nightlife' | 'Rainy day' | 'Family' | 'Other'
export type TimelineMode = 'all' | 'today' | 'upcoming'
export type TimelineStatus = 'past' | 'today' | 'upcoming'
export type TimelineDay = DayPlan & { index: number; status: TimelineStatus; isToday: boolean }
export type RewriteIntent = 'relaxed' | 'cheaper' | 'rainy' | 'foodier' | 'family'
export type TripTemplate = {
  id: string
  title: string
  destination: string
  days: number
  rating: number
  saves: string
  angle: string
  tags: string[]
  pace: Pace
  budget: Budget
  interests: string[]
  dayThemes: string[]
}

export type StorageResult<T> = { ok: true; value: T } | { ok: false; value: T; error: string }

export type OnboardingStep = 'destination' | 'dates' | 'style' | 'logistics' | 'review'
export type OnboardingState = { step: OnboardingStep; completed: boolean; skipped: boolean }

export const onboardingSteps: OnboardingStep[] = ['destination', 'dates', 'style', 'logistics', 'review']

export const defaultOnboarding: OnboardingState = { step: 'destination', completed: false, skipped: false }

export function onboardingProgress(step: OnboardingStep) {
  const index = Math.max(onboardingSteps.indexOf(step), 0)
  return { index: index + 1, total: onboardingSteps.length, percent: Math.round(((index + 1) / onboardingSteps.length) * 100) }
}

export function validateOnboardingStep(step: OnboardingStep, form: TripForm, logistics: TripLogistics) {
  if (step === 'destination' && !form.destination.trim()) return { ok: false, message: 'Add a destination first.' }
  if (step === 'dates' && (dayCount(form.startDate, form.endDate) < 1 || dayCount(form.startDate, form.endDate) > 14)) return { ok: false, message: 'Choose 1–14 travel days.' }
  if (step === 'style' && form.travelers < 1) return { ok: false, message: 'Add at least one traveler.' }
  if (step === 'logistics' && !(logistics.homeBaseName || logistics.homeBaseAddress)) return { ok: true, message: 'You can add this later.' }
  return { ok: true }
}

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep {
  return onboardingSteps[Math.min(onboardingSteps.indexOf(step) + 1, onboardingSteps.length - 1)]
}

export function previousOnboardingStep(step: OnboardingStep): OnboardingStep {
  return onboardingSteps[Math.max(onboardingSteps.indexOf(step) - 1, 0)]
}

export function shouldShowOnboarding(state: OnboardingState, savedTrips: SavedTrip[]) {
  return !state.completed && !state.skipped && savedTrips.length === 0
}

export function safeReadStorageJson<T>(storage: Storage, key: string, fallback: T, validate?: (value: unknown) => value is T): StorageResult<T> {
  try {
    const raw = storage.getItem(key)
    if (!raw) return { ok: true, value: fallback }
    const parsed = JSON.parse(raw) as unknown
    if (validate && !validate(parsed)) return { ok: false, value: fallback, error: `Invalid ${key}` }
    return { ok: true, value: parsed as T }
  } catch (error) {
    return { ok: false, value: fallback, error: error instanceof Error ? error.message : String(error) }
  }
}

export function safeWriteStorageJson<T>(storage: Storage, key: string, value: T) {
  try {
    storage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export function categorizeIdea(tag: string, title: string, reason = ''): IdeaCategory {
  const text = `${tag} ${title} ${reason}`.toLowerCase()
  if (/rain|indoor|museum|backup/.test(text)) return 'Rainy day'
  if (/food|dinner|lunch|market|cafe|restaurant/.test(text)) return 'Food'
  if (/culture|temple|museum|gallery|landmark/.test(text)) return 'Culture'
  if (/outdoor|park|view|walk|waterfront/.test(text)) return 'Outdoors'
  if (/shop|souvenir|design|market/.test(text)) return 'Shopping'
  if (/night|bar|music|sunset/.test(text)) return 'Nightlife'
  if (/family|kid|play|easy/.test(text)) return 'Family'
  return 'Other'
}

export function filterSavedIdeas(ideas: SavedIdea[], query: string, category: IdeaCategory | 'All' = 'All') {
  const normalized = normalize(query)
  return ideas.filter((idea) => {
    const ideaCategory = categorizeIdea(idea.tag, idea.title, idea.reason)
    const categoryOk = category === 'All' || ideaCategory === category
    const textOk = !normalized || normalize(`${idea.title} ${idea.destination} ${idea.tag} ${idea.reason}`).includes(normalized)
    return categoryOk && textOk
  })
}

export function addIdeaToPlanDay(plan: DayPlan[], idea: SavedIdea, dayId: string, destination: string, now = Date.now(), slot: Slot = idea.slot): DayPlan[] {
  if (!plan.some((day) => day.id === dayId)) return plan
  const activity: Activity = { id: `${dayId}-${idea.id}-${now}`, slot, title: idea.title, note: idea.reason, cost: idea.cost, location: `${idea.title} ${destination}` }
  return plan.map((day) => day.id === dayId ? { ...day, activities: [...day.activities, activity] } : day)
}

export function buildTimeline(plan: DayPlan[], todayIso = new Date().toISOString().slice(0, 10)): TimelineDay[] {
  return plan.map((day, index) => {
    const status: TimelineStatus = day.date < todayIso ? 'past' : day.date === todayIso ? 'today' : 'upcoming'
    return { ...day, index, status, isToday: status === 'today' }
  })
}

export function selectedTimelineDays(timeline: TimelineDay[], mode: TimelineMode): TimelineDay[] {
  if (mode === 'all') return timeline
  if (mode === 'today') return timeline.filter((day) => day.isToday).slice(0, 1)
  return timeline.filter((day) => day.status === 'today' || day.status === 'upcoming')
}

function downgradeCost(cost: Cost): Cost {
  if (cost === '$$$') return '$$'
  if (cost === '$$') return '$'
  if (cost === '$') return 'Free'
  return cost
}

export function rewriteTripPlan(form: TripForm, plan: DayPlan[], intent: RewriteIntent): DayPlan[] {
  return plan.map((day) => {
    let activities = day.activities.map((activity) => ({ ...activity }))
    let rainyDay = day.rainyDay
    let summary = day.summary
    if (intent === 'relaxed') {
      activities = activities.length > 2 ? activities.slice(0, Math.max(2, activities.length - 1)) : activities
      summary = `${summary} Relaxed rewrite: protect one flexible rest block.`
    }
    if (intent === 'cheaper') {
      activities = activities.map((activity) => ({ ...activity, cost: downgradeCost(activity.cost), note: `${activity.note} Favor low-cost or free options here.` }))
    }
    if (intent === 'rainy') {
      rainyDay = `Indoor / covered backup near ${form.destination}: museum, covered market, or cafe reset.`
      activities = activities.map((activity) => ({ ...activity, backup: activity.backup || rainyDay }))
    }
    if (intent === 'foodier' && !activities.some((activity) => /food|dinner|lunch|market|cafe/i.test(activity.title))) {
      activities = [...activities, { id: `${day.id}-food-${hashText(day.id)}`, slot: 'Evening', title: 'Local food anchor', note: 'Add one memorable but low-friction meal stop.', cost: form.budget === 'Shoestring' ? '$' : '$$', location: 'local restaurant' }]
    }
    if (intent === 'family') {
      activities = activities.map((activity) => ({ ...activity, note: `${activity.note} Keep timing kid-friendly and leave a reset buffer.` }))
      if (!activities.some((activity) => /reset|family/i.test(activity.title))) activities.push({ id: `${day.id}-family-reset`, slot: 'Flex', title: 'Family reset block', note: 'Protected downtime for snacks, bathrooms, and tired legs.', cost: 'Free', location: 'home base' })
    }
    return { ...day, activities, rainyDay, summary }
  })
}

export const expandedTemplates: TripTemplate[] = [
  { id: 'lisbon-food-weekend', title: 'Lisbon food + culture weekend', destination: 'Lisbon', days: 3, rating: 4.8, saves: '2.4k', angle: 'Markets, Alfama, viewpoints, and one relaxed dinner anchor.', tags: ['Food', 'Culture', 'Weekend'], pace: 'Balanced', budget: 'Comfort', interests: ['Food', 'Culture', 'Hidden gems'], dayThemes: ['Arrival + Alfama', 'Markets + viewpoints', 'Slow finish'] },
  { id: 'kyoto-slow-temples', title: 'Kyoto temples without burnout', destination: 'Kyoto', days: 4, rating: 4.9, saves: '1.9k', angle: 'Early temples, cafe resets, and easy neighborhood clusters.', tags: ['Culture', 'Slow travel'], pace: 'Relaxed', budget: 'Comfort', interests: ['Culture', 'Food', 'Outdoors'], dayThemes: ['Arrival', 'Higashiyama', 'Arashiyama', 'Slow finish'] },
  { id: 'seoul-shop-food', title: 'Seoul shopping + food loop', destination: 'Seoul', days: 5, rating: 4.7, saves: '3.1k', angle: 'Markets, boutiques, cafes, and low-friction evening blocks.', tags: ['Food', 'Shopping'], pace: 'Balanced', budget: 'Comfort', interests: ['Food', 'Shopping', 'Nightlife'], dayThemes: ['Myeongdong', 'Seongsu', 'Markets', 'Hannam', 'Departure'] },
  { id: 'tokyo-first-timer', title: 'Tokyo first-timer compact route', destination: 'Tokyo', days: 3, rating: 4.8, saves: '4.6k', angle: 'One major area per day so transit does not eat the trip.', tags: ['First-timer', 'City break'], pace: 'Balanced', budget: 'Comfort', interests: ['Food', 'Culture', 'Shopping'], dayThemes: ['West Tokyo', 'Old Tokyo', 'Food finish'] },
  { id: 'taipei-family', title: 'Taipei family easy mode', destination: 'Taipei', days: 3, rating: 4.6, saves: '1.2k', angle: 'Night markets, parks, and forgiving family pacing.', tags: ['Family', 'Food'], pace: 'Relaxed', budget: 'Comfort', interests: ['Family', 'Food', 'Outdoors'], dayThemes: ['Arrival bites', 'Parks + markets', 'Easy departure'] },
  { id: 'bangkok-shoestring', title: 'Bangkok shoestring explorer', destination: 'Bangkok', days: 4, rating: 4.5, saves: '2.1k', angle: 'Street food, river transit, temples, and cheap resets.', tags: ['Budget', 'Food'], pace: 'Balanced', budget: 'Shoestring', interests: ['Food', 'Culture', 'Hidden gems'], dayThemes: ['River intro', 'Temples', 'Markets', 'Slow finish'] },
  { id: 'paris-treat', title: 'Paris treat-yourself mini break', destination: 'Paris', days: 4, rating: 4.8, saves: '3.8k', angle: 'One elegant anchor daily without overstuffing.', tags: ['Luxury', 'Culture'], pace: 'Relaxed', budget: 'Treat yourself', interests: ['Food', 'Culture', 'Shopping'], dayThemes: ['Arrival dinner', 'Museums', 'Shopping', 'Cafe finish'] },
  { id: 'osaka-food', title: 'Osaka food crawl', destination: 'Osaka', days: 3, rating: 4.7, saves: '2.8k', angle: 'Food-first neighborhoods with practical buffers.', tags: ['Food', 'Nightlife'], pace: 'Packed', budget: 'Comfort', interests: ['Food', 'Nightlife', 'Hidden gems'], dayThemes: ['Dotonbori', 'Markets', 'Castle + bites'] },
  { id: 'melbourne-rain', title: 'Melbourne rainy-day proof', destination: 'Melbourne', days: 3, rating: 4.4, saves: '870', angle: 'Laneways, galleries, covered markets, and coffee resets.', tags: ['Rainy day', 'Culture'], pace: 'Relaxed', budget: 'Comfort', interests: ['Culture', 'Food', 'Shopping'], dayThemes: ['Laneways', 'Galleries', 'Market finish'] },
  { id: 'bali-outdoors', title: 'Bali outdoors reset', destination: 'Bali', days: 5, rating: 4.6, saves: '2.0k', angle: 'Views, beaches, easy food anchors, and buffer time.', tags: ['Outdoors', 'Relaxed'], pace: 'Relaxed', budget: 'Comfort', interests: ['Outdoors', 'Food', 'Hidden gems'], dayThemes: ['Arrival', 'Beach', 'Rice terraces', 'Food', 'Departure'] },
]

export function filterTemplates(templates: TripTemplate[], query: string) {
  const normalized = normalize(query)
  if (!normalized) return templates
  return templates.filter((template) => normalize(`${template.title} ${template.destination} ${template.tags.join(' ')} ${template.angle}`).includes(normalized))
}

export function cloneTemplateToDraft(template: TripTemplate, startDate: string) {
  const safeDays = Math.min(Math.max(template.days, 1), 14)
  const form: TripForm = { destination: template.destination, startDate, endDate: isoAdd(startDate, safeDays - 1), travelers: 2, pace: template.pace, budget: template.budget, interests: template.interests }
  const plan = generatePlan(form).map((day, index) => ({ ...day, title: template.dayThemes[index] ?? day.title, summary: `${template.angle} ${day.summary}` }))
  return { template, form, logistics: emptyLogistics, plan }
}

export function forkSharedTrip(trip: SavedTrip, now = new Date().toISOString()): SavedTrip {
  const seed = `${trip.id}-${now}`
  return {
    ...makeSavedTrip(
      { ...trip.form, interests: [...trip.form.interests] },
      { ...trip.logistics, importantNotes: [trip.logistics.importantNotes, 'Forked from a shared Tiny Trip link.'].filter(Boolean).join('\n') },
      trip.plan.map((day) => ({ ...day, activities: day.activities.map((activity) => ({ ...activity })) })),
      { id: `fork-${hashText(seed)}`, name: `${trip.name || trip.form.destination} copy`, createdAt: now, updatedAt: now },
    ),
  }
}

export function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function searchTrips(trips: SavedTrip[], query: string) {
  const normalized = normalize(query)
  if (!normalized) return trips
  return trips.filter((trip) => normalize(`${trip.name} ${trip.form.destination} ${trip.form.interests.join(' ')} ${trip.plan.flatMap((day) => day.activities.map((activity) => activity.title)).join(' ')}`).includes(normalized))
}

export function timelineSummary(plan: DayPlan[], todayIso = new Date().toISOString().slice(0, 10)) {
  const timeline = buildTimeline(plan, todayIso)
  const today = timeline.find((day) => day.isToday)
  const next = timeline.find((day) => day.status === 'upcoming')
  return {
    label: today ? `You are on Day ${today.index + 1}` : next ? `${next.index + 1} day${next.index + 1 === 1 ? '' : 's'} until this trip starts` : 'Past trip',
    detail: plan.length ? `${plan.length} days · ${formatDate(plan[0].date)} → ${formatDate(plan[plan.length - 1].date)}` : 'No itinerary yet',
  }
}
