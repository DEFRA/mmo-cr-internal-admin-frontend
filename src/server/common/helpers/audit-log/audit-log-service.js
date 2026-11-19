import { readFileSync } from 'node:fs'

import { toIsoDate } from '../vessels/vessels-service.js'

export const AUDIT_LOG_PAGE_SIZE = 10

export const RECORD_TYPES = [
  { value: 'user', text: 'User' },
  { value: 'vessel', text: 'Vessel' },
  { value: 'trip', text: 'Fishing trip' }
]

// Newest first, as in the prototype. Read-only, so it is not copied into the
// session store.
const auditEntries = Object.freeze(
  JSON.parse(
    readFileSync(
      new URL('../../mock-data/admin/audit-log.json', import.meta.url),
      'utf-8'
    )
  )
)

export const allAuditEntries = () => auditEntries

export const recordTypeText = (value) =>
  RECORD_TYPES.find((type) => type.value === value)?.text ?? value

const contains = (value, term) =>
  (value ?? '').toLowerCase().includes(term.toLowerCase())

/**
 * Audit log search and filters, as in the prototype. Incomplete or invalid
 * dates are ignored.
 */
export function searchAuditEntries(
  entries,
  { s = '', from = {}, to = {}, performedBy = '', recordType = [] } = {}
) {
  const term = s.trim()
  const by = performedBy.trim()
  const fromDate = toIsoDate(from)
  const toDate = toIsoDate(to)

  return entries.filter((entry) => {
    const date = entry.dateTime.slice(0, 10)
    const searchable = [
      entry.recordType,
      entry.reference,
      entry.userId,
      entry.userName,
      entry.vesselReference,
      entry.action,
      entry.performedBy
    ]
    return (
      (!term || searchable.some((field) => contains(field, term))) &&
      (!by || contains(entry.performedBy, by)) &&
      (!recordType.length || recordType.includes(entry.recordType)) &&
      (!fromDate || date >= fromDate) &&
      (!toDate || date <= toDate)
    )
  })
}

/**
 * Where each entry's record reference and user ID link to in this portal.
 * References with no matching record are shown as plain text.
 */
export function auditEntryLinks(entry, store) {
  const userHref = store.users.some((user) => user.id === entry.userId)
    ? `/users/${entry.userId}`
    : null
  let referenceHref = null

  if (entry.recordType === 'trip') {
    const trip = store.trips.find((item) => item.tripId === entry.reference)
    referenceHref = trip?.hasProfile
      ? `/fishing-trips/${trip.tripId}${entry.linkToNotes ? '#notes' : ''}`
      : null
  } else if (entry.recordType === 'vessel') {
    const vessel = store.vessels.find((item) => item.pln === entry.reference)
    referenceHref = vessel ? `/vessels/${vessel.id}` : null
  } else {
    const user = store.users.find((item) => item.fullName === entry.reference)
    referenceHref = user ? `/users/${user.id}` : null
  }

  return { referenceHref, userHref }
}
