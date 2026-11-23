const sections = [
  { text: 'Users', href: '/users' },
  { text: 'Vessels', href: '/vessels' },
  // Trip details layout testing pages sit under Fishing trips, as in the prototype
  { text: 'Fishing trips', href: '/fishing-trips', also: ['/trip-layouts'] },
  {
    text: 'Trip breakdown',
    href: '/trip-breakdown',
    permission: 'tripBreakdown'
  },
  { text: 'Audit log', href: '/audit-log', permission: 'auditLog' },
  {
    text: 'Banner message',
    href: '/banner-message',
    permission: 'bannerMessage'
  }
]

// Sections the role cannot use are left out, as in the prototype
export function buildNavigation(request, permissions) {
  const path = request?.path ?? ''

  const within = (base) => path === base || path.startsWith(`${base}/`)

  return sections
    .filter(
      ({ permission }) => !permission || !permissions || permissions[permission]
    )
    .map(({ also = [], permission, ...section }) => ({
      ...section,
      current: [section.href, ...also].some(within)
    }))
}
