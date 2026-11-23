import { TRIP_STATUSES, VESSEL_STATUSES } from './constants.js'
import { toCsv } from '../csv/csv.js'

const nowIso = () => new Date().toISOString()
const contains = (value, term) =>
  (value ?? '').toLowerCase().includes(term.toLowerCase())

export function findVesselById(store, vesselId) {
  return store.vessels.find((vessel) => vessel.id === vesselId) ?? null
}

export const vesselStatusLabel = (status) =>
  VESSEL_STATUSES.find((item) => item.value === status)?.text ?? status

export const tripStatus = (status) =>
  TRIP_STATUSES.find((item) => item.value === status) ?? {
    text: status,
    tagClass: 'govuk-tag--grey'
  }

/**
 * Vessels list search (name, PLN, RSS or CFR) combined with the filter panel.
 */
export function searchVessels(
  vessels,
  { s = '', vessel = '', adminPort = '', status = [], administration = [] } = {}
) {
  const term = s.trim()
  const vesselTerm = vessel.trim()
  const portTerm = adminPort.trim()

  return vessels.filter((item) => {
    if (
      term &&
      ![item.name, item.pln, item.rss, item.cfr].some((field) =>
        contains(field, term)
      )
    ) {
      return false
    }
    if (
      vesselTerm &&
      !contains(item.name, vesselTerm) &&
      !contains(item.pln, vesselTerm)
    ) {
      return false
    }
    if (portTerm && !contains(item.adminPort, portTerm)) return false
    if (status.length && !status.includes(item.status)) return false
    if (
      administration.length &&
      !administration.includes(item.administration)
    ) {
      return false
    }
    return true
  })
}

export function vesselUsers(store, vessel) {
  return store.users
    .flatMap((user) =>
      user.vessels
        .filter((link) => link.vesselId === vessel.id)
        .map((link) => ({ user, role: link.role, linkedOn: link.linkedOn }))
    )
    .sort((a, b) => a.linkedOn.localeCompare(b.linkedOn))
}

export function linkableUsers(store, vessel) {
  const linked = new Set(vesselUsers(store, vessel).map(({ user }) => user.id))
  return store.users.filter(
    (user) => !linked.has(user.id) && user.status !== 'deactivated'
  )
}

/**
 * Fishing trips tab filters: exact trip end date, user name and status.
 */
export function filterVesselTrips(
  trips,
  { from, to, user = '', status = [] } = {}
) {
  return trips.filter((trip) => {
    const endDate = trip.endDate.slice(0, 10)
    if (from && endDate < from) return false
    if (to && endDate > to) return false
    if (user.trim() && !contains(trip.user, user.trim())) return false
    if (status.length && !status.includes(trip.status)) return false
    return true
  })
}

/**
 * Returns an ISO date (yyyy-mm-dd) when day, month and year form a real date.
 */
export function toIsoDate({ day, month, year } = {}) {
  if (!day || !month || !year) return null
  const [d, m, y] = [day, month, year].map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const isValid =
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  return isValid ? date.toISOString().slice(0, 10) : null
}

export function addVesselNote(vessel, text, actor) {
  const dateTime = nowIso()
  vessel.notes.unshift({ author: actor.name, role: actor.role, dateTime, text })
  vessel.history.unshift({
    dateTime,
    action: 'Note added',
    performedBy: actor.name
  })
  return vessel
}

export function vesselsToCsv(vessels) {
  const header = [
    'Vessel',
    'PLN',
    'RSS',
    'Administration',
    'Admin port',
    'Port code',
    'CFR number',
    'Status'
  ]
  const rows = vessels.map((vessel) => [
    vessel.name,
    vessel.pln,
    vessel.rss,
    vessel.administration,
    vessel.adminPort,
    vessel.portCode,
    vessel.cfr,
    vesselStatusLabel(vessel.status)
  ])

  return toCsv([header, ...rows])
}
