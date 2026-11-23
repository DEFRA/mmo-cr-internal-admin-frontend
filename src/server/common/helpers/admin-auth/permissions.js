import { ADMIN_ROLES } from './admin-user.js'
import { VESSEL_ROLES } from '../users/constants.js'

const SKIPPER_ROLE = 'Skipper (Master)'

/**
 * What each admin role can do, as previewed in the prototype (catch-records-v2
 * role-preview). Pages a role cannot use send it back to Users, and the
 * related buttons and links are hidden.
 */
const ALL = [
  'tripBreakdown',
  'auditLog',
  'bannerMessage',
  'manageUsers',
  'deactivateUsers',
  'linkVessels',
  'accessCatchRecording',
  'amendCatch',
  'exportData',
  'userNotes'
]

const ROLE_PERMISSIONS = {
  'service-manager': ALL,
  'fishing-vessel-licensing': [
    'manageUsers',
    'deactivateUsers',
    'linkVessels',
    'userNotes'
  ],
  helpline: [
    'tripBreakdown',
    'accessCatchRecording',
    'amendCatch',
    'userNotes'
  ],
  compliance: ['tripBreakdown', 'exportData'],
  'other-operations': ['tripBreakdown', 'exportData'],
  // FDST links users to vessels as Skipper (Master) only
  fdst: [
    'tripBreakdown',
    'manageUsers',
    'linkVessels',
    'skipperOnly',
    'exportData',
    'userNotes'
  ],
  'full-ops': [
    'tripBreakdown',
    'manageUsers',
    'deactivateUsers',
    'linkVessels',
    'accessCatchRecording',
    'amendCatch',
    'exportData',
    'userNotes'
  ],
  'compliance-with-licensing': [
    'tripBreakdown',
    'manageUsers',
    'deactivateUsers',
    'linkVessels',
    'exportData',
    'userNotes'
  ]
}

export function permissionsFor(user) {
  const role = ADMIN_ROLES.find((item) => item.name === user?.role)
  const granted = new Set(ROLE_PERMISSIONS[role?.key] ?? [])
  return Object.fromEntries(
    [...ALL, 'skipperOnly'].map((name) => [name, granted.has(name)])
  )
}

// Pages each permission protects. Notes on vessels and trips are open to all roles.
const PROTECTED_PATHS = [
  [/^\/trip-breakdown(\/|$)/, 'tripBreakdown'],
  [/^\/audit-log(\/|$)/, 'auditLog'],
  [/^\/banner-message(\/|$)/, 'bannerMessage'],
  [/^\/users\/create(\/|$)/, 'manageUsers'],
  [/^\/users\/[^/]+\/amend$/, 'manageUsers'],
  [/^\/users\/[^/]+\/(deactivate|reactivate)$/, 'deactivateUsers'],
  [/^\/users\/[^/]+\/vessels\//, 'linkVessels'],
  [/^\/vessels\/[^/]+\/users\//, 'linkVessels'],
  [/^\/users\/[^/]+\/access-catch-recording$/, 'accessCatchRecording'],
  [/^\/users\/[^/]+\/notes$/, 'userNotes'],
  [/^\/fishing-trips\/[^/]+\/amend$/, 'amendCatch'],
  [/^\/fishing-trips\/[^/]+\/pdf$/, 'exportData'],
  [/^\/(vessels|fishing-trips)\/export$/, 'exportData']
]

export function requiredPermission(path) {
  return PROTECTED_PATHS.find(([pattern]) => pattern.test(path))?.[1] ?? null
}

/**
 * Vessel roles the signed-in user may give or remove when linking users and
 * vessels. FDST works with Skipper (Master) links only.
 */
export function linkRolesFor(user) {
  return permissionsFor(user).skipperOnly
    ? VESSEL_ROLES.filter((role) => role === SKIPPER_ROLE)
    : VESSEL_ROLES
}
