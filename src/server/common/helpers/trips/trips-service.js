import { SUBMISSION_METHODS } from './constants.js'
import { toIsoDate } from '../vessels/vessels-service.js'
import { TRIP_STATUSES } from '../vessels/constants.js'
import { toCsv } from '../csv/csv.js'

const contains = (value, term) =>
  (value ?? '').toLowerCase().includes(term.toLowerCase())

export function findTrip(store, tripId) {
  return store.trips.find((trip) => trip.tripId === tripId) ?? null
}

export const submissionMethod = (value) =>
  SUBMISSION_METHODS.find((method) => method.value === value)

const statusText = (status) =>
  TRIP_STATUSES.find((item) => item.value === status)?.text ?? status

/**
 * Fishing trips list: free-text search plus the filter panel. Invalid or
 * incomplete dates in the range are ignored.
 */
export function searchTrips(
  trips,
  {
    s = '',
    from = {},
    to = {},
    vessel = '',
    createdBy = '',
    adminPort = '',
    rss = '',
    status = [],
    submissionMethod: methods = []
  } = {}
) {
  const term = s.trim()
  const fromDate = toIsoDate(from)
  const toDate = toIsoDate(to)

  return trips.filter((trip) => {
    const endDate = trip.tripEndDate.slice(0, 10)
    if (
      term &&
      ![
        trip.tripId,
        trip.vesselName,
        trip.pln,
        trip.rss,
        statusText(trip.status)
      ].some((field) => contains(field, term))
    ) {
      return false
    }
    if (fromDate && endDate < fromDate) return false
    if (toDate && endDate > toDate) return false
    if (
      vessel.trim() &&
      ![trip.vesselName, trip.pln, trip.rss].some((field) =>
        contains(field, vessel.trim())
      )
    ) {
      return false
    }
    if (createdBy.trim() && !contains(trip.createdBy, createdBy.trim())) {
      return false
    }
    if (adminPort.trim() && !contains(trip.adminPort, adminPort.trim())) {
      return false
    }
    if (rss.trim() && !contains(trip.rss, rss.trim())) return false
    if (status.length && !status.includes(trip.status)) return false
    if (methods.length && !methods.includes(trip.submissionMethod)) return false
    return true
  })
}

/**
 * Resolves which version of a trip record to show.
 * version: undefined (latest), 'current', 'original' or 'amendment-N'.
 */
export function tripVersion(trip, version) {
  const amendments = trip.amendments ?? []
  const latest = amendments.at(-1)

  if (version === 'original') {
    return {
      kind: 'original',
      status: 'submitted',
      retainedCatch: trip.original.retainedCatch,
      gears: trip.original.gears
    }
  }

  const match = /^amendment-(\d+)$/.exec(version ?? '')
  const amendment = match
    ? amendments.find((item) => item.number === Number(match[1]))
    : latest

  if (match && !amendment) {
    return null
  }

  if (!amendment) {
    return {
      kind: 'latest',
      status: trip.status,
      retainedCatch: trip.retainedCatch,
      gears: trip.gears
    }
  }

  return {
    kind: version ? 'version' : 'latest',
    status: trip.status,
    amendment,
    isCurrent: amendment === latest,
    retainedCatch: amendment.retainedCatch,
    gears: amendment.gears
  }
}

export function addTripNote(trip, text, actor) {
  const dateTime = new Date().toISOString()
  trip.notes.unshift({ author: actor.name, role: actor.role, dateTime, text })
  trip.history.unshift({
    dateTime,
    action: 'Note added',
    performedBy: actor.name
  })
  return trip
}

/**
 * Vessel role of the person who submitted the trip, e.g. "Owner (Nominee)",
 * taken from their link to the trip's vessel.
 */
export function submitterRole(store, trip) {
  const user = store.users.find((item) => item.fullName === trip.createdBy)
  const link = user?.vessels.find((item) => item.vesselId === trip.vesselId)
  return link?.role ?? trip.userRole ?? ''
}

const isoDay = (value) => (value ?? '').slice(0, 10)

export function tripsToCsv(store, trips) {
  const header = [
    'Trip ID',
    'Trip start date',
    'Trip end date',
    'Vessel',
    'PLN',
    'RSS',
    'Admin port',
    'Created by',
    'User role',
    'Retained catch',
    'Status',
    'Submission method',
    'Created on'
  ]
  const rows = trips.map((trip) => [
    trip.tripId,
    isoDay(trip.tripStartDate),
    isoDay(trip.tripEndDate),
    trip.vesselName,
    trip.pln,
    trip.rss,
    trip.adminPort,
    trip.createdBy,
    submitterRole(store, trip),
    trip.retainedCatch,
    statusText(trip.status),
    submissionMethod(trip.submissionMethod)?.text ?? trip.submissionMethod,
    trip.createdOn
  ])

  return toCsv([header, ...rows])
}
