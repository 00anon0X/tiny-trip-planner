import { describe, expect, it } from 'vitest'
import { pathFor, resolveView } from './routes'

describe('marketing/app route separation', () => {
  it('keeps marketing, login, share, and app routes separate', () => {
    expect(resolveView('/')).toBe('marketing')
    expect(resolveView('/login')).toBe('login')
    expect(resolveView('/app')).toBe('dashboard')
    expect(resolveView('/share')).toBe('share')
  })

  it('sends unknown deep links to marketing and maps known paths', () => {
    expect(resolveView('/anything-else')).toBe('marketing')
    expect(pathFor('dashboard')).toBe('/app')
    expect(pathFor('share')).toBe('/share')
  })
})
