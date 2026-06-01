export type View = 'marketing' | 'login' | 'dashboard'

export function resolveView(pathname: string): View {
  if (pathname === '/' || pathname === '') return 'marketing'
  if (pathname === '/app') return 'dashboard'
  if (pathname === '/login') return 'login'
  return 'login'
}

export function pathFor(view: View): string {
  if (view === 'marketing') return '/'
  if (view === 'dashboard') return '/app'
  return '/login'
}
