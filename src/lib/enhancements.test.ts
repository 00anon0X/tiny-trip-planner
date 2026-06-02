import { describe, expect, it } from 'vitest'
import { emptyLogistics, generatePlan, makeSavedTrip, sampleTrip } from './trip'
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
} from './enhancements'
import { savedIdeaFromRecommendation } from './sprint'
import { getDashboardRecommendations } from './dashboard'

describe('final dashboard enhancements', () => {
  it('adds saved ideas to the selected day without mutating the original plan', () => {
    const plan = generatePlan(sampleTrip)
    const idea = savedIdeaFromRecommendation(getDashboardRecommendations(sampleTrip, emptyLogistics)[0], sampleTrip.destination)
    const next = addIdeaToPlanDay(plan, idea, plan[1].id, sampleTrip.destination, 123)

    expect(next).not.toBe(plan)
    expect(next[0].activities).toHaveLength(plan[0].activities.length)
    expect(next[1].activities).toHaveLength(plan[1].activities.length + 1)
    expect(next[1].activities.at(-1)?.title).toBe(idea.title)
  })

  it('categorizes and filters saved ideas', () => {
    expect(categorizeIdea('Rainy day', 'Museum fallback', 'Indoor backup')).toBe('Rainy day')
    expect(categorizeIdea('Food', 'Market lunch', 'Crowd-pleaser')).toBe('Food')
    const rec = getDashboardRecommendations(sampleTrip, emptyLogistics)[0]
    const idea = savedIdeaFromRecommendation(rec, sampleTrip.destination)
    expect(filterSavedIdeas([idea], 'market')).toHaveLength(1)
    expect(filterSavedIdeas([idea], 'kyoto')).toHaveLength(0)
  })

  it('builds timeline modes and defaults to upcoming days', () => {
    const timeline = buildTimeline(generatePlan(sampleTrip), '2026-07-11')
    expect(timeline.map((day) => day.status)).toEqual(['past', 'today', 'upcoming'])
    expect(selectedTimelineDays(timeline, 'today')).toHaveLength(1)
    expect(selectedTimelineDays(timeline, 'upcoming')).toHaveLength(2)
  })

  it('rewrites trips deterministically for relaxed, cheaper, and rainy modes', () => {
    const packed = { ...sampleTrip, pace: 'Packed' as const, budget: 'Treat yourself' as const }
    const plan = generatePlan(packed)
    const relaxed = rewriteTripPlan(packed, plan, 'relaxed')
    const cheap = rewriteTripPlan(packed, plan, 'cheaper')
    const rainy = rewriteTripPlan(packed, plan, 'rainy')

    expect(relaxed[0].activities.length).toBeLessThanOrEqual(plan[0].activities.length)
    expect(cheap.flatMap((day) => day.activities).some((activity) => activity.cost === '$$$')).toBe(false)
    expect(rainy.every((day) => /indoor|covered|rain/i.test(day.rainyDay))).toBe(true)
  })

  it('expands templates and clones one into a draft', () => {
    expect(expandedTemplates.length).toBeGreaterThanOrEqual(10)
    expect(filterTemplates(expandedTemplates, 'family').some((template) => template.tags.includes('Family'))).toBe(true)
    const draft = cloneTemplateToDraft(expandedTemplates.find((template) => template.destination === 'Taipei')!, '2026-12-30')
    expect(draft.form.destination).toBe('Taipei')
    expect(draft.plan).toHaveLength(draft.template.days)
    expect(draft.form.endDate).toBe('2027-01-01')
  })

  it('forks a shared trip and searches saved trips', () => {
    const original = makeSavedTrip(sampleTrip, emptyLogistics, generatePlan(sampleTrip), { id: 'original', name: 'Lisbon shared', createdAt: '2026-01-01T00:00:00.000Z' })
    const fork = forkSharedTrip(original, '2026-02-01T00:00:00.000Z')
    expect(fork.id).not.toBe(original.id)
    expect(fork.name).toContain('copy')
    expect(fork.form.destination).toBe('Lisbon')
    expect(searchTrips([fork], 'culture')).toHaveLength(1)
  })

  it('storage helpers tolerate read and write failures', () => {
    const badStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('quota') },
    } as unknown as Storage
    expect(safeReadStorageJson(badStorage, 'x', { ok: true }).value.ok).toBe(true)
    expect(safeWriteStorageJson(badStorage, 'x', { ok: true }).ok).toBe(false)
  })
})
