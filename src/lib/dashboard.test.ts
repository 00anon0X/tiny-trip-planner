import { describe, expect, it } from 'vitest'
import {
  buildShareSummary,
  featuredItineraries,
  getDashboardRecommendations,
  getTravelerTrends,
  tripReadiness,
} from './dashboard'
import { emptyLogistics, generatePlan, sampleTrip } from './trip'

describe('dashboard intelligence', () => {
  it('scores readiness and points to missing planning steps', () => {
    const result = tripReadiness(sampleTrip, emptyLogistics, generatePlan(sampleTrip), false)

    expect(result.score).toBeLessThan(100)
    expect(result.items.some((item) => item.label.includes('Save'))).toBe(true)
    expect(result.items.some((item) => item.label.includes('home base') && !item.done)).toBe(true)
  })

  it('recommends destination-aware actions that can be added to the itinerary', () => {
    const recommendations = getDashboardRecommendations({ ...sampleTrip, destination: 'Lisbon', interests: ['Food', 'Culture'] }, emptyLogistics)

    expect(recommendations.length).toBeGreaterThanOrEqual(4)
    expect(recommendations[0]).toMatchObject({ action: 'Add to itinerary' })
    expect(recommendations.map((item) => item.title).join(' ')).toMatch(/market|Alfama|viewpoint|rain/i)
  })

  it('surfaces honest popular-travel patterns without claiming live data', () => {
    const trends = getTravelerTrends(sampleTrip)

    expect(trends[0].label).toMatch(/Common|Often|Weekend|Travellers/i)
    expect(trends.every((trend) => trend.source === 'curated pattern')).toBe(true)
  })

  it('provides cloneable featured itineraries', () => {
    expect(featuredItineraries.length).toBeGreaterThanOrEqual(4)
    expect(featuredItineraries.every((template) => template.destination && template.days > 0 && template.rating > 0)).toBe(true)
  })

  it('builds a short shareable itinerary summary', () => {
    const summary = buildShareSummary({ name: 'Lisbon draft', form: sampleTrip, logistics: emptyLogistics, plan: generatePlan(sampleTrip), id: 'x', createdAt: 'now', updatedAt: 'now' })

    expect(summary).toContain('Lisbon draft')
    expect(summary).toContain('Day 1')
    expect(summary.length).toBeLessThan(1600)
  })
})
