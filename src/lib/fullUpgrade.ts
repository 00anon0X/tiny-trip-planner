import { tripReadiness } from './dashboard'
import { budgetSnapshot, checklistItems, tripQualityWarnings, type BudgetSummary, type ChecklistItem, type QualityWarning } from './sprint'
import { dayCount, emptyLogistics, generatePlan, googleDirectionsUrl, googleMapsSearchUrl, isoAdd, makeSavedTrip, sampleTrip, type Activity, type DayPlan, type SavedTrip, type TripForm, type TripLogistics } from './trip'

export type QuickStartDraft = { form: TripForm; logistics: TripLogistics; plan: DayPlan[] }
export type ConflictSeverity = 'info' | 'warning'
export type TripConflict = { id: string; severity: ConflictSeverity; title: string; detail: string; action: string }
export type TripHealthSummary = {
  readinessScore: number
  status: 'Strong' | 'Needs fixes' | 'Draft'
  warnings: QualityWarning[]
  conflicts: TripConflict[]
  checklist: ChecklistItem[]
  budget: BudgetSummary
  fixCount: number
}
export type TodayCommand = {
  label: string
  detail: string
  date: string
  dayTitle: string
  activities: Array<Activity & { mapUrl: string; directionsUrl: string }>
}
export type TripComparison = {
  leftName: string
  rightName: string
  destination: [string, string]
  days: [number, number]
  pace: [string, string]
  budget: [string, string]
  activityCount: [number, number]
  readiness: [number, number]
  logisticsComplete: [boolean, boolean]
  warningCount: [number, number]
  verdict: string
}

export function quickStartDraft(current: TripForm, startDate = current.startDate || sampleTrip.startDate): QuickStartDraft {
  const destination = current.destination.trim() || sampleTrip.destination
  const form: TripForm = {
    destination,
    startDate,
    endDate: isoAdd(startDate, 2),
    travelers: Math.max(current.travelers || 2, 1),
    pace: current.pace || 'Balanced',
    budget: current.budget || 'Comfort',
    interests: current.interests.length ? current.interests : ['Food', 'Culture', 'Outdoors'],
  }
  return { form, logistics: emptyLogistics, plan: generatePlan(form) }
}

function hasFood(day: DayPlan) {
  return day.activities.some((activity) => /food|market|dinner|lunch|cafe|breakfast|restaurant/i.test(`${activity.title} ${activity.note}`))
}

export function tripConflictChecks(form: TripForm, logistics: TripLogistics, plan: DayPlan[]): TripConflict[] {
  const conflicts: TripConflict[] = []
  const expectedDays = Math.max(dayCount(form.startDate, form.endDate), 1)
  if (plan.length !== expectedDays) conflicts.push({ id: 'date-mismatch', severity: 'warning', title: 'Date range and plan length differ', detail: `Dates imply ${expectedDays} days but the itinerary has ${plan.length}.`, action: 'Regenerate plan' })
  if (!logistics.homeBaseName && !logistics.homeBaseAddress) conflicts.push({ id: 'missing-home-base', severity: 'warning', title: 'No home base for directions', detail: 'Directions and nearby meal choices work better after adding a stay area.', action: 'Add home base' })

  plan.forEach((day, index) => {
    const label = `Day ${index + 1}`
    if (day.activities.length === 0) conflicts.push({ id: `${day.id}-empty`, severity: 'warning', title: `${label} is empty`, detail: 'A shared or printed itinerary should not have blank travel days.', action: 'Add item' })
    if (day.activities.length > 4 || ((index === 0 || index === plan.length - 1) && day.activities.length > 3)) conflicts.push({ id: `${day.id}-overpacked`, severity: 'warning', title: `${label} may be overpacked`, detail: 'Arrival/departure days need extra buffer for transport and delays.', action: 'Make lighter' })
    if (!hasFood(day)) conflicts.push({ id: `${day.id}-food`, severity: 'info', title: `${label} has no food anchor`, detail: 'Add one lunch, market, cafe, or dinner stop to keep the day grounded.', action: 'Add food anchor' })
    if (!day.rainyDay) conflicts.push({ id: `${day.id}-rain`, severity: 'info', title: `${label} lacks a rainy-day backup`, detail: 'Add one covered/indoor fallback so weather does not break the day.', action: 'Rain-proof' })
    const titles = new Set<string>()
    for (const activity of day.activities) {
      const key = activity.title.trim().toLowerCase()
      if (key && titles.has(key)) conflicts.push({ id: `${day.id}-duplicate-${key}`, severity: 'warning', title: `${label} repeats “${activity.title}”`, detail: 'Duplicate activities usually mean the plan needs cleanup before sharing.', action: 'Review day' })
      titles.add(key)
    }
    const slotCounts = day.activities.reduce<Record<string, number>>((acc, activity) => ({ ...acc, [activity.slot]: (acc[activity.slot] || 0) + 1 }), {})
    if (Object.values(slotCounts).some((count) => count >= 3)) conflicts.push({ id: `${day.id}-slot-stack`, severity: 'info', title: `${label} stacks one time slot`, detail: 'Spread activities across morning, afternoon, evening, and flex windows.', action: 'Reorder' })
  })
  return conflicts
}

export function tripHealthSummary(form: TripForm, logistics: TripLogistics, plan: DayPlan[], isSaved: boolean, doneIds: string[] = []): TripHealthSummary {
  const readiness = tripReadiness(form, logistics, plan, isSaved)
  const warnings = tripQualityWarnings(form, logistics, plan)
  const conflicts = tripConflictChecks(form, logistics, plan)
  const checklist = checklistItems(form, logistics, plan, isSaved).map((item) => ({ ...item, done: item.done || doneIds.includes(item.id) }))
  const fixCount = warnings.length + conflicts.filter((conflict) => conflict.severity === 'warning').length + checklist.filter((item) => !item.done).length
  return {
    readinessScore: readiness.score,
    status: readiness.score >= 80 && conflicts.filter((item) => item.severity === 'warning').length === 0 ? 'Strong' : readiness.score >= 50 ? 'Needs fixes' : 'Draft',
    warnings,
    conflicts,
    checklist,
    budget: budgetSnapshot(form, plan),
    fixCount,
  }
}

export function todayCommandCenter(plan: DayPlan[], destination: string, homeBase = '', todayIso = new Date().toISOString().slice(0, 10)): TodayCommand {
  const target = plan.find((day) => day.date === todayIso) ?? plan.find((day) => day.date > todayIso) ?? plan[plan.length - 1]
  if (!target) return { label: 'No trip plan yet', detail: 'Generate a starter plan first.', date: '', dayTitle: '', activities: [] }
  const isToday = target.date === todayIso
  return {
    label: isToday ? 'Today mode' : target.date > todayIso ? 'Next travel day' : 'Last planned day',
    detail: `${target.activities.length} stops · ${target.dontMiss}`,
    date: target.date,
    dayTitle: target.title,
    activities: target.activities.slice(0, 4).map((activity) => ({
      ...activity,
      mapUrl: googleMapsSearchUrl(destination, activity.location || activity.title),
      directionsUrl: homeBase ? googleDirectionsUrl(homeBase, activity.location || activity.title) : googleMapsSearchUrl(destination, activity.location || activity.title),
    })),
  }
}

function countActivities(trip: SavedTrip) {
  return trip.plan.reduce((sum, day) => sum + day.activities.length, 0)
}

export function compareTrips(left: SavedTrip, right: SavedTrip): TripComparison {
  const leftReady = tripReadiness(left.form, left.logistics, left.plan, true).score
  const rightReady = tripReadiness(right.form, right.logistics, right.plan, true).score
  const leftWarnings = tripQualityWarnings(left.form, left.logistics, left.plan).length + tripConflictChecks(left.form, left.logistics, left.plan).length
  const rightWarnings = tripQualityWarnings(right.form, right.logistics, right.plan).length + tripConflictChecks(right.form, right.logistics, right.plan).length
  const readinessDelta = rightReady - leftReady
  const warningDelta = leftWarnings - rightWarnings
  return {
    leftName: left.name,
    rightName: right.name,
    destination: [left.form.destination, right.form.destination],
    days: [dayCount(left.form.startDate, left.form.endDate), dayCount(right.form.startDate, right.form.endDate)],
    pace: [left.form.pace, right.form.pace],
    budget: [left.form.budget, right.form.budget],
    activityCount: [countActivities(left), countActivities(right)],
    readiness: [leftReady, rightReady],
    logisticsComplete: [Boolean(left.logistics.homeBaseName || left.logistics.homeBaseAddress), Boolean(right.logistics.homeBaseName || right.logistics.homeBaseAddress)],
    warningCount: [leftWarnings, rightWarnings],
    verdict: readinessDelta > 10 || warningDelta > 1 ? `${right.name} looks cleaner` : readinessDelta < -10 || warningDelta < -1 ? `${left.name} looks cleaner` : 'Both trips are close',
  }
}

export function templateToComparableTrip(template: { title: string }, form: TripForm, logistics: TripLogistics, plan: DayPlan[]): SavedTrip {
  return makeSavedTrip(form, logistics, plan, { id: `template-${form.destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name: template.title, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' })
}
