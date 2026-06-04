import { cleanup, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

function renderApp(path = '/app') {
  window.history.pushState({}, '', path)
  window.localStorage.clear()
  return render(<App />)
}

describe('simplified app shell', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('uses four primary navigation items and removes tool nav clutter', () => {
    renderApp()

    const nav = screen.getAllByRole('complementary').find((element) => element.classList.contains('app-sidebar'))!
    expect(within(nav).getByRole('button', { name: /^Plan$/ })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /^Ideas$/ })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /Trips/ })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: /^Share$/ })).toBeInTheDocument()
    expect(within(nav).queryByRole('button', { name: /Dashboard|Plan Studio|Handoff|Export|Ideas & Templates/i })).not.toBeInTheDocument()
  })

  it('makes planning the default workspace with one next-step card instead of dashboard card sprawl', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Plan', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Plan my trip', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create itinerary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Next step', level: 3 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Trip Health|Conflict fixes|Trip quality|Handoff hub|What travellers often do/i })).not.toBeInTheDocument()
  })

  it('keeps itinerary rows calm by hiding edit controls inside details', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Itinerary', level: 2 })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Map' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText('More').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '↑' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '↓' })).not.toBeInTheDocument()
  })
})
