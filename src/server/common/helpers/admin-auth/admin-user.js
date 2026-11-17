const SESSION_KEY = 'adminUser'

export const ADMIN_ROLES = [
  { key: 'service-manager', name: 'Service Manager', status: 'Available' },
  {
    key: 'fishing-vessel-licensing',
    name: 'Fishing Vessel Licensing',
    status: 'Available'
  },
  { key: 'helpline', name: 'Helpline Team', status: 'Available' },
  {
    key: 'compliance',
    name: 'Compliance / Investigations',
    status: 'Available'
  },
  {
    key: 'other-operations',
    name: 'Other Operations Team',
    status: 'Available'
  },
  { key: 'fdst', name: 'FDST', status: 'Available' },
  { key: 'full-ops', name: 'Full Ops', status: 'New' },
  {
    key: 'compliance-with-licensing',
    name: 'Compliance with Licensing',
    status: 'New'
  }
]

// Mock identity used until a real identity provider is integrated (ADR 0001)
export const MOCK_ADMIN_USER = Object.freeze({
  name: 'Sam Smith',
  email: 'preview@example.test',
  role: 'Service Manager'
})

export function getAdminUser(request) {
  try {
    return request?.yar?.get(SESSION_KEY) ?? null
  } catch {
    // The session is not loaded for requests that never reach a route (404s)
    return null
  }
}

export function signIn(request) {
  request.yar.set(SESSION_KEY, { ...MOCK_ADMIN_USER })
}

export function setAdminRole(request, roleName) {
  const user = getAdminUser(request)
  if (user) {
    request.yar.set(SESSION_KEY, { ...user, role: roleName })
  }
}
