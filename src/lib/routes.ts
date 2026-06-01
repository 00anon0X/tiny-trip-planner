export type View = 'marketing' | 'login' | 'dashboard' | 'share'

export function resolveView(pathname: string): View {
  if (pathname === '/' || pathname === '') return 'marketing'
  if (pathname === '/app') return 'dashboard'
  if (pathname === '/login') return 'login'
  if (pathname === '/share') return 'share'
  return 'marketing'
}

export function pathFor(view: View) {
  if (view === 'dashboard') return '/app'
  if (view === 'login') return '/login'
  if (view === 'share') return '/share'
  return '/'
}
