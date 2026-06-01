import { tripReadiness, type DashboardRecommendation } from './dashboard'
import { dayCount, type DayPlan, type SavedTrip, type TripForm, type TripLogistics } from './trip'

export type TripCard = {
  id: string
  title: string
  destination: string
  dates: string
  days: number
  readiness: number
  updatedAt: string
}

export type SavedIdea = {
  id: string
  title: string
  destination: string
  tag: string
  reason: string
  slot: DashboardRecommendation['slot']
  cost: DashboardRecommendation['cost']
  status: 'saved'
  createdAt: string
}

export type ChecklistItem = { id: string; label: string; done: boolean; detail: string }
export type BudgetCategory = { label: string; low: number; high: number }
export type BudgetSummary = { dailyLow: number; dailyHigh: number; totalLow: number; totalHigh: number; categories: BudgetCategory[] }
export type QualityWarning = { id: string; severity: 'info' | 'warning'; title: string; detail: string }
export type ShareBriefItem = { label: string; value: string }

export function sortTripsForDashboard(trips: SavedTrip[]): TripCard[] {
  return [...trips]
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .map((trip) => ({
      id: trip.id,
      title: trip.name,
      destination: trip.form.destination,
      dates: `${trip.form.startDate} → ${trip.form.endDate}`,
      days: dayCount(trip.form.startDate, trip.form.endDate),
      readiness: tripReadiness(trip.form, trip.logistics, trip.plan, true).score,
      updatedAt: trip.updatedAt,
    }))
}

export function savedIdeaFromRecommendation(rec: DashboardRecommendation, destination: string): SavedIdea {
  return {
    id: `idea-${rec.id}-${Date.now()}`,
    title: rec.title,
    destination,
    tag: rec.tag,
    reason: rec.reason,
    slot: rec.slot,
    cost: rec.cost,
    status: 'saved',
    createdAt: new Date().toISOString(),
  }
}

export function encodeTripForShare(trip: SavedTrip): string {
  const text = JSON.stringify(trip)
  const encoded = btoa(unescape(encodeURIComponent(text)))
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decodeTripFromShare(encoded: string): SavedTrip | null {
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const text = decodeURIComponent(escape(atob(padded)))
    const parsed = JSON.parse(text) as SavedTrip
    if (!parsed?.form?.destination || !Array.isArray(parsed.plan)) return null
    return parsed
  } catch {
    return null
  }
}

export function shareUrl(trip: SavedTrip, origin = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${origin}/share#trip=${encodeTripForShare(trip)}`
}

export function sharePrintBrief(trip: SavedTrip): ShareBriefItem[] {
  const logistics = trip.logistics
  const dates = `${trip.form.startDate} → ${trip.form.endDate}`
  const homeBase = [logistics.homeBaseName, logistics.homeBaseAddress].filter(Boolean).join(' · ')
  const travelNotes = [logistics.arrivalMode && `Arrive: ${logistics.arrivalMode}`, logistics.departureMode && `Depart: ${logistics.departureMode}`].filter(Boolean).join(' · ')
  const stayWindow = [logistics.checkInTime && `Check-in ${logistics.checkInTime}`, logistics.checkOutTime && `Check-out ${logistics.checkOutTime}`].filter(Boolean).join(' · ')

  return [
    { label: 'Dates', value: `${dates} · ${dayCount(trip.form.startDate, trip.form.endDate)} days` },
    { label: 'Travelers', value: `${trip.form.travelers} traveler${trip.form.travelers === 1 ? '' : 's'} · ${trip.form.pace} pace · ${trip.form.budget}` },
    { label: 'Interests', value: trip.form.interests.length ? trip.form.interests.join(', ') : 'No interests selected' },
    { label: 'Home base', value: homeBase || 'Not added yet' },
    { label: 'Arrival / departure', value: travelNotes || 'Not added yet' },
    { label: 'Stay window', value: stayWindow || 'Not added yet' },
    { label: 'Important notes', value: logistics.importantNotes || 'None' },
  ]
}

export function checklistItems(form: TripForm, logistics: TripLogistics, plan: DayPlan[], isSaved: boolean): ChecklistItem[] {
  return [
    { id: 'save', label: 'Save the trip', done: isSaved, detail: isSaved ? 'Saved locally' : 'Protect the draft before travel' },
    { id: 'home', label: 'Add a home base', done: Boolean(logistics.homeBaseName || logistics.homeBaseAddress), detail: 'Needed for nearby food/map decisions' },
    { id: 'arrival', label: 'Add arrival/departure notes', done: Boolean(logistics.arrivalMode || logistics.departureMode), detail: 'Reduce airport/train-station friction' },
    { id: 'hotel', label: 'Book hotel or apartment', done: Boolean(logistics.homeBaseName), detail: 'Use the home-base field when booked' },
    { id: 'meal', label: 'Reserve one anchor meal/activity', done: plan.some((day) => day.activities.some((activity) => activity.cost === 'Prepaid')), detail: 'One booked anchor is usually enough' },
    { id: 'weather', label: 'Keep rainy-day backups', done: plan.some((day) => day.rainyDay), detail: 'Indoor alternatives are already generated' },
    { id: 'maps', label: 'Download offline maps', done: false, detail: `Download ${form.destination} before flying` },
    { id: 'docs', label: 'Check passport/visa/insurance', done: false, detail: 'Manual check before departure' },
  ]
}

export function budgetSnapshot(form: TripForm, plan: DayPlan[]): BudgetSummary {
  const multiplier = form.budget === 'Shoestring' ? 0.7 : form.budget === 'Treat yourself' ? 1.65 : 1
  const categories: BudgetCategory[] = [
    { label: 'Food', low: Math.round(35 * multiplier), high: Math.round(75 * multiplier) },
    { label: 'Transport', low: Math.round(8 * multiplier), high: Math.round(24 * multiplier) },
    { label: 'Tickets', low: Math.round(15 * multiplier), high: Math.round(55 * multiplier) },
    { label: 'Buffer', low: Math.round(20 * multiplier), high: Math.round(60 * multiplier) },
  ]
  const dailyLow = categories.reduce((sum, item) => sum + item.low, 0)
  const dailyHigh = categories.reduce((sum, item) => sum + item.high, 0)
  const days = Math.max(plan.length, dayCount(form.startDate, form.endDate), 1)
  return { dailyLow, dailyHigh, totalLow: dailyLow * days, totalHigh: dailyHigh * days, categories }
}

export function tripQualityWarnings(form: TripForm, logistics: TripLogistics, plan: DayPlan[]): QualityWarning[] {
  const warnings: QualityWarning[] = []
  if (form.pace === 'Packed' || plan.some((day) => day.activities.length > 4)) warnings.push({ id: 'packed', severity: 'warning', title: 'This trip may feel packed', detail: 'Keep one flex block so delays do not domino.' })
  if (!logistics.homeBaseName && !logistics.homeBaseAddress) warnings.push({ id: 'home-base', severity: 'warning', title: 'No home base yet', detail: 'Map links and nearby dinner choices work better once you add it.' })
  if (!plan.some((day) => day.activities.some((activity) => /food|market|dinner|lunch|cafe/i.test(`${activity.title} ${activity.note}`)))) warnings.push({ id: 'food', severity: 'info', title: 'No obvious food anchor', detail: 'Add at least one food block so the day does not become random.' })
  if (!plan.some((day) => day.rainyDay)) warnings.push({ id: 'rain', severity: 'info', title: 'No rainy-day fallback', detail: 'Add one indoor backup for walk-heavy days.' })
  if (dayCount(form.startDate, form.endDate) <= 3 && plan[0]?.activities.length > 3) warnings.push({ id: 'arrival', severity: 'warning', title: 'Arrival day may be ambitious', detail: 'Short trips work better with a soft first evening.' })
  return warnings
}
