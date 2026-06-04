import { describe, expect, it } from 'vitest'
import { emptyLogistics, generatePlan, makeSavedTrip, sampleTrip } from './trip'
import { compareTrips, quickStartDraft, templateToComparableTrip, todayCommandCenter, tripConflictChecks, tripHealthSummary } from './fullUpgrade'

describe('full upgrade planning helpers', () => {
  it('builds a one-click starter draft with safe defaults', () => {
    const draft = quickStartDraft({ ...sampleTrip, destination: '', interests: [], travelers: 0 }, '2026-08-01')

    expect(draft.form).toMatchObject({ destination: 'Lisbon', startDate: '2026-08-01', endDate: '2026-08-03', travelers: 2 })
    expect(draft.form.interests).toEqual(['Food', 'Culture', 'Outdoors'])
    expect(draft.plan).toHaveLength(3)
    expect(draft.logistics).toEqual(emptyLogistics)
  })

  it('detects overpacking, duplicate titles, missing food, and missing home base', () => {
    const plan = generatePlan(sampleTrip).map((day, index) => index === 0 ? {
      ...day,
      rainyDay: '',
      activities: [
        { id: 'a', slot: 'Morning' as const, title: 'Museum', note: 'Walk', cost: '$$' as const },
        { id: 'b', slot: 'Morning' as const, title: 'Museum', note: 'Duplicate', cost: '$$' as const },
        { id: 'c', slot: 'Morning' as const, title: 'Viewpoint', note: 'Walk', cost: 'Free' as const },
        { id: 'd', slot: 'Afternoon' as const, title: 'Gallery', note: 'Walk', cost: '$' as const },
      ],
    } : day)

    const conflicts = tripConflictChecks({ ...sampleTrip, interests: ['Culture'] }, emptyLogistics, plan)

    expect(conflicts.map((item) => item.id)).toContain('missing-home-base')
    expect(conflicts.some((item) => item.id.endsWith('overpacked'))).toBe(true)
    expect(conflicts.some((item) => item.id.includes('duplicate'))).toBe(true)
    expect(conflicts.some((item) => item.id.endsWith('food'))).toBe(true)
    expect(conflicts.some((item) => item.id.endsWith('rain'))).toBe(true)
    expect(conflicts.some((item) => item.id.endsWith('slot-stack'))).toBe(true)
  })

  it('summarizes readiness, warnings, conflicts, checklist, and budget in one health object', () => {
    const plan = generatePlan(sampleTrip)
    const health = tripHealthSummary(sampleTrip, emptyLogistics, plan, false, ['maps'])

    expect(health.readinessScore).toBeLessThan(100)
    expect(health.status).not.toBe('Strong')
    expect(health.fixCount).toBeGreaterThan(0)
    expect(health.budget.totalHigh).toBeGreaterThan(health.budget.totalLow)
    expect(health.checklist.find((item) => item.id === 'maps')?.done).toBe(true)
  })

  it('creates a today command center with maps and directions links', () => {
    const plan = generatePlan(sampleTrip)
    const command = todayCommandCenter(plan, sampleTrip.destination, 'Hotel QA', '2026-07-10')

    expect(command.label).toBe('Today mode')
    expect(command.dayTitle).toBe(plan[0].title)
    expect(command.activities[0].mapUrl).toContain('/maps/search/')
    expect(command.activities[0].directionsUrl).toContain('/maps/dir/')
  })

  it('falls forward to the next travel day before a trip starts', () => {
    const plan = generatePlan(sampleTrip)
    const command = todayCommandCenter(plan, sampleTrip.destination, '', '2026-07-01')

    expect(command.label).toBe('Next travel day')
    expect(command.date).toBe(sampleTrip.startDate)
  })

  it('compares saved trips by core planning dimensions', () => {
    const left = makeSavedTrip(sampleTrip, emptyLogistics, generatePlan(sampleTrip), { id: 'left', name: 'Current draft' })
    const rightForm = { ...sampleTrip, destination: 'Kyoto', endDate: '2026-07-13', pace: 'Relaxed' as const, budget: 'Treat yourself' as const }
    const right = makeSavedTrip(rightForm, { ...emptyLogistics, homeBaseName: 'Hotel QA' }, generatePlan(rightForm), { id: 'right', name: 'Kyoto template' })

    const comparison = compareTrips(left, right)

    expect(comparison.destination).toEqual(['Lisbon', 'Kyoto'])
    expect(comparison.days).toEqual([3, 4])
    expect(comparison.pace).toEqual(['Balanced', 'Relaxed'])
    expect(comparison.budget).toEqual(['Comfort', 'Treat yourself'])
    expect(comparison.logisticsComplete).toEqual([false, true])
    expect(comparison.verdict).toMatch(/cleaner|close/)
  })

  it('wraps template drafts as comparable saved trips', () => {
    const plan = generatePlan(sampleTrip)
    const trip = templateToComparableTrip({ title: 'Lisbon template' }, sampleTrip, emptyLogistics, plan)

    expect(trip.name).toBe('Lisbon template')
    expect(trip.form.destination).toBe(sampleTrip.destination)
    expect(trip.plan).toHaveLength(plan.length)
  })
})
