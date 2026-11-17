const sections = [
  { text: 'Users', href: '/users' },
  { text: 'Vessels', href: '/vessels' },
  // Trip details layout testing pages sit under Fishing trips, as in the prototype
  { text: 'Fishing trips', href: '/fishing-trips', also: ['/trip-layouts'] },
  { text: 'Trip breakdown', href: '/trip-breakdown' },
  { text: 'Audit log', href: '/audit-log' },
  { text: 'Banner message', href: '/banner-message' }
]

export function buildNavigation(request) {
  const path = request?.path ?? ''

  const within = (base) => path === base || path.startsWith(`${base}/`)

  return sections.map(({ also = [], ...section }) => ({
    ...section,
    current: [section.href, ...also].some(within)
  }))
}
