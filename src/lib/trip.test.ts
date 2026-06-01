import { describe, expect, it } from 'vitest'
import {
  applyPreset,
  dayCount,
  generatePlan,
  googleMapsSearchUrl,
  makeSavedTrip,
  sampleTrip,
  safeReadJson,
  tripToIcs,
  tripToMarkdown,
} from './trip'

describe('trip planner core', () => {
  it('generates deterministic pace-aware plans with arrival and departure anchors', () => {
    const relaxed = generatePlan({ ...sampleTrip, pace: 'Relaxed' })
    const relaxedAgain = generatePlan({ ...sampleTrip, pace: 'Relaxed' })
    const packed = generatePlan({ ...sampleTrip, pace: 'Packed' })

    expect(relaxed).toEqual(relaxedAgain)
    expect(relaxed).toHaveLength(3)
    expect(relaxed[0].activities).toHaveLength(2)
    expect(packed[0].activities).toHaveLength(4)
    expect(relaxed[0].activities[0].title).toBe('Arrival buffer')
    expect(relaxed.at(-1)?.activities.at(-1)?.title).toBe('Departure prep')
  })

  it('counts days inclusively and caps generated plans at 14 days', () => {
    expect(dayCount('2026-07-10', '2026-07-10')).toBe(1)
    expect(dayCount('2026-07-12', '2026-07-10')).toBeLessThan(1)
    expect(generatePlan({ ...sampleTrip, startDate: '2026-07-01', endDate: '2026-08-01' })).toHaveLength(14)
  })

  it('exports edited itinerary, logistics, backup ideas, and calendar data', () => {
    const plan = generatePlan(sampleTrip)
    plan[0].activities[0].title = 'Custom landing lunch'
    const trip = makeSavedTrip(sampleTrip, {
      homeBaseName: 'Casa Alfama',
      homeBaseAddress: 'Alfama, Lisbon',
      arrivalMode: 'Metro from airport',
      departureMode: 'Taxi buffer',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      importantNotes: 'Book tram tickets early',
    }, plan)

    const markdown = tripToMarkdown(trip)
    const ics = tripToIcs(trip)

    expect(markdown).toContain('Custom landing lunch')
    expect(markdown).toContain('Casa Alfama')
    expect(markdown).toContain('Rainy-day backups')
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('SUMMARY:Custom landing lunch')
  })

  it('applies presets without wiping destination or dates', () => {
    const next = applyPreset(sampleTrip, 'family-easy')
    expect(next.destination).toBe(sampleTrip.destination)
    expect(next.startDate).toBe(sampleTrip.startDate)
    expect(next.pace).toBe('Relaxed')
    expect(next.interests).toContain('Family')
  })

  it('keeps storage and map-link helpers safe', () => {
    expect(safeReadJson('not-json', { ok: true })).toEqual({ ok: true })
    expect(googleMapsSearchUrl('Mexico City & Puebla', 'Roma Norte, CDMX')).toContain('Roma+Norte')
    expect(googleMapsSearchUrl('Mexico City & Puebla')).toContain('Mexico+City')
  })
})
