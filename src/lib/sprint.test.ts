import { describe, expect, it } from 'vitest'
import {
  budgetSnapshot,
  checklistItems,
  decodeTripFromShare,
  encodeTripForShare,
  savedIdeaFromRecommendation,
  sortTripsForDashboard,
  tripQualityWarnings,
} from './sprint'
import { getDashboardRecommendations } from './dashboard'
import { emptyLogistics, generatePlan, makeSavedTrip, sampleTrip } from './trip'

describe('next sprint product helpers', () => {
  it('sorts saved trips with newest first and exposes dashboard card data', () => {
    const older = { ...makeSavedTrip(sampleTrip, emptyLogistics, generatePlan(sampleTrip), { id: 'old', name: 'Older' }), createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    const newer = { ...makeSavedTrip({ ...sampleTrip, destination: 'Tokyo' }, emptyLogistics, generatePlan(sampleTrip), { id: 'new', name: 'Newer' }), createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-03T00:00:00.000Z' }

    const cards = sortTripsForDashboard([older, newer])

    expect(cards[0]).toMatchObject({ id: 'new', title: 'Newer', destination: 'Tokyo' })
    expect(cards[0].readiness).toBeGreaterThan(0)
  })

  it('turns recommendations into saved-for-later ideas', () => {
    const rec = getDashboardRecommendations(sampleTrip, emptyLogistics)[0]
    const idea = savedIdeaFromRecommendation(rec, sampleTrip.destination)

    expect(idea.title).toBe(rec.title)
    expect(idea.destination).toBe(sampleTrip.destination)
    expect(idea.status).toBe('saved')
  })

  it('encodes and decodes trips for share URLs', () => {
    const trip = makeSavedTrip(sampleTrip, emptyLogistics, generatePlan(sampleTrip), { name: 'Share test' })
    const encoded = encodeTripForShare(trip)
    const decoded = decodeTripFromShare(encoded)

    expect(encoded.length).toBeGreaterThan(20)
    expect(decoded?.name).toBe('Share test')
    expect(decoded?.form.destination).toBe(sampleTrip.destination)
  })

  it('provides checklist completion defaults', () => {
    const items = checklistItems(sampleTrip, emptyLogistics, generatePlan(sampleTrip), false)

    expect(items.length).toBeGreaterThanOrEqual(7)
    expect(items.some((item) => item.label.includes('home base') && item.done === false)).toBe(true)
  })

  it('summarizes budget and quality warnings', () => {
    const plan = generatePlan({ ...sampleTrip, pace: 'Packed' })
    const budget = budgetSnapshot({ ...sampleTrip, budget: 'Comfort' }, plan)
    const warnings = tripQualityWarnings({ ...sampleTrip, pace: 'Packed' }, emptyLogistics, plan)

    expect(budget.totalLow).toBeGreaterThan(0)
    expect(budget.categories.length).toBeGreaterThanOrEqual(4)
    expect(warnings.some((warning) => warning.severity === 'warning')).toBe(true)
  })
})
