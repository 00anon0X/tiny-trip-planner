import { describe, expect, it } from 'vitest'
import { pathFor, resolveView } from './routes'

describe('marketing/app route separation', () => {
  it('keeps marketing, login, and app routes separate', () => {
    expect(resolveView('/')).toBe('marketing')
    expect(resolveView('/login')).toBe('login')
    expect(resolveView('/app')).toBe('dashboard')
  })

  it('sends unknown deep links to the login page instead of mixing marketing and app UI', () => {
    expect(resolveView('/anything-else')).toBe('login')
    expect(pathFor('dashboard')).toBe('/app')
  })
})
