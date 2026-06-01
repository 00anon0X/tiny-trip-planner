import { dayCount, type DayPlan, type SavedTrip, type TripForm, type TripLogistics } from './trip'

export type ReadinessItem = { label: string; done: boolean; detail: string }
export type DashboardRecommendation = {
  id: string
  title: string
  tag: string
  reason: string
  action: string
  slot: 'Morning' | 'Afternoon' | 'Evening' | 'Flex'
  cost: 'Free' | '$' | '$$' | '$$$' | 'Prepaid'
}
export type TravelerTrend = { label: string; percent: number; source: 'curated pattern'; note: string }
export type FeaturedItinerary = {
  id: string
  title: string
  destination: string
  days: number
  rating: number
  saves: string
  angle: string
  tags: string[]
}

export function tripReadiness(form: TripForm, logistics: TripLogistics, plan: DayPlan[], isSaved: boolean) {
  const items: ReadinessItem[] = [
    { label: 'Destination and dates selected', done: Boolean(form.destination.trim()) && dayCount(form.startDate, form.endDate) > 0, detail: `${form.destination || 'No destination'} · ${dayCount(form.startDate, form.endDate)} days` },
    { label: 'Itinerary generated', done: plan.length > 0 && plan.every((day) => day.activities.length > 0), detail: `${plan.length} planned days` },
    { label: 'Add a home base', done: Boolean(logistics.homeBaseName.trim() || logistics.homeBaseAddress.trim()), detail: logistics.homeBaseName || logistics.homeBaseAddress || 'Hotel/neighborhood not set' },
    { label: 'Rainy-day backups included', done: plan.some((day) => day.rainyDay), detail: 'Fallbacks help short trips survive bad weather' },
    { label: 'Save or export before travel', done: isSaved, detail: isSaved ? 'Saved locally' : 'Still an unsaved draft' },
  ]
  return { score: Math.round((items.filter((item) => item.done).length / items.length) * 100), items }
}

const cityRecommendations: Record<string, DashboardRecommendation[]> = {
  lisbon: [
    { id: 'lisbon-market', title: 'Time Out Market food stop', tag: 'Food', reason: 'Easy crowd-pleaser when people want options without overplanning.', action: 'Add to itinerary', slot: 'Afternoon', cost: '$$' },
    { id: 'lisbon-alfama', title: 'Alfama orientation walk', tag: 'Culture', reason: 'Good low-cost first-day anchor that still feels specific to Lisbon.', action: 'Add to itinerary', slot: 'Morning', cost: 'Free' },
    { id: 'lisbon-viewpoint', title: 'Sunset viewpoint buffer', tag: 'Popular pick', reason: 'Commonly added by weekend travellers because it makes the day feel memorable.', action: 'Add to itinerary', slot: 'Evening', cost: 'Free' },
    { id: 'lisbon-rain', title: 'MAAT or tile museum fallback', tag: 'Rainy day', reason: 'Useful indoor swap if hills/weather make the outdoor plan annoying.', action: 'Add to itinerary', slot: 'Afternoon', cost: '$$' },
  ],
  kyoto: [
    { id: 'kyoto-temple', title: 'Early temple walk', tag: 'Culture', reason: 'Morning timing avoids the worst crowds.', action: 'Add to itinerary', slot: 'Morning', cost: '$' },
    { id: 'kyoto-cafe', title: 'Machiya cafe pause', tag: 'Slow travel', reason: 'Keeps the day from becoming temple fatigue.', action: 'Add to itinerary', slot: 'Afternoon', cost: '$$' },
  ],
  seoul: [
    { id: 'seoul-market', title: 'Gwangjang market crawl', tag: 'Food', reason: 'High-energy food block that works well for groups.', action: 'Add to itinerary', slot: 'Evening', cost: '$$' },
    { id: 'seoul-shopping', title: 'Seongsu or Hannam browse', tag: 'Shopping', reason: 'Good flexible block with cafes, shops, and rainy-day options.', action: 'Add to itinerary', slot: 'Afternoon', cost: '$$' },
  ],
}

const genericRecommendations: DashboardRecommendation[] = [
  { id: 'generic-first-night', title: 'Keep first night near the home base', tag: 'Low effort', reason: 'Most short trips go smoother when arrival night has no ambitious transit.', action: 'Add to itinerary', slot: 'Evening', cost: '$$' },
  { id: 'generic-bookahead', title: 'Book one anchor meal or ticket', tag: 'Worth booking', reason: 'One reserved anchor reduces decision fatigue without over-scheduling.', action: 'Add to itinerary', slot: 'Flex', cost: 'Prepaid' },
  { id: 'generic-rain', title: 'Indoor backup within 20 minutes', tag: 'Rainy day', reason: 'A nearby fallback prevents the day from collapsing if weather turns.', action: 'Add to itinerary', slot: 'Afternoon', cost: '$' },
]

export function getDashboardRecommendations(form: TripForm, logistics: TripLogistics): DashboardRecommendation[] {
  const key = form.destination.toLowerCase()
  const city = Object.entries(cityRecommendations).find(([cityKey]) => key.includes(cityKey))?.[1] ?? []
  const homeBase: DashboardRecommendation[] = logistics.homeBaseName || logistics.homeBaseAddress ? [{ id: 'home-base-food', title: `Dinner near ${logistics.homeBaseName || 'home base'}`, tag: 'Near your base', reason: 'Keeps one evening easy and makes the trip feel grounded.', action: 'Add to itinerary', slot: 'Evening', cost: '$$' }] : []
  return [...city, ...homeBase, ...genericRecommendations].slice(0, 6)
}

export function getTravelerTrends(form: TripForm): TravelerTrend[] {
  const weekend = dayCount(form.startDate, form.endDate) <= 3
  return [
    { label: weekend ? 'Weekend travellers usually keep arrival night light' : 'Travellers often leave one flexible half-day', percent: weekend ? 72 : 64, source: 'curated pattern', note: 'Prevents a short trip from feeling overstuffed.' },
    { label: 'Common pick: one food market or casual food crawl', percent: 58, source: 'curated pattern', note: 'Works across budgets and group sizes.' },
    { label: 'Often added: one sunset/viewpoint moment', percent: 44, source: 'curated pattern', note: 'High memory value, low planning effort.' },
    { label: 'Practical planners add an indoor backup', percent: 39, source: 'curated pattern', note: 'Especially useful for walk-heavy cities.' },
  ]
}

export const featuredItineraries: FeaturedItinerary[] = [
  { id: 'lisbon-3-food-culture', title: 'Lisbon food + culture weekend', destination: 'Lisbon', days: 3, rating: 4.8, saves: '2.4k', angle: 'Markets, Alfama, viewpoints, and one relaxed dinner anchor.', tags: ['Food', 'Culture', 'Weekend'] },
  { id: 'kyoto-4-temples-cafes', title: 'Kyoto temples without burnout', destination: 'Kyoto', days: 4, rating: 4.9, saves: '1.9k', angle: 'Early temples, cafe resets, and easy neighborhood clusters.', tags: ['Culture', 'Slow travel'] },
  { id: 'seoul-5-shopping-food', title: 'Seoul shopping + food loop', destination: 'Seoul', days: 5, rating: 4.7, saves: '3.1k', angle: 'Markets, boutiques, cafes, and low-friction evening blocks.', tags: ['Food', 'Shopping'] },
  { id: 'tokyo-3-first-timer', title: 'Tokyo first-timer compact route', destination: 'Tokyo', days: 3, rating: 4.8, saves: '4.6k', angle: 'One major area per day so transit does not eat the trip.', tags: ['First-timer', 'City break'] },
]

export function buildShareSummary(trip: SavedTrip): string {
  const lines = [`${trip.name}`, `${trip.form.destination} · ${dayCount(trip.form.startDate, trip.form.endDate)} days · ${trip.form.pace}`, '']
  trip.plan.slice(0, 5).forEach((day, index) => {
    lines.push(`Day ${index + 1}: ${day.title}`)
    day.activities.slice(0, 3).forEach((activity) => lines.push(`- ${activity.slot}: ${activity.title}`))
  })
  lines.push('', 'Planned with Tiny Trip.')
  return lines.join('\n').slice(0, 1500)
}
