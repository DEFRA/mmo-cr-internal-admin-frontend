import { readFileSync } from 'node:fs'
import { format, parseISO } from 'date-fns'

import { toCsv } from '../csv/csv.js'
import { toIsoDate } from '../vessels/vessels-service.js'

export const TRIP_BREAKDOWN_PAGE_SIZE = 10

// One row per species caught with a gear on a trip. Read-only, so it is not
// copied into the session store.
const catchEntries = Object.freeze(
  JSON.parse(
    readFileSync(
      new URL('../../mock-data/admin/trip-breakdown.json', import.meta.url),
      'utf-8'
    )
  )
)

export const allCatchEntries = () => catchEntries

const contains = (value, term) =>
  (value ?? '').toLowerCase().includes(term.toLowerCase())

const anyContains = (values, term) =>
  values.some((value) => contains(value, term))

const toNumber = (value) => {
  const number = Number.parseFloat(value)
  return Number.isNaN(number) ? null : number
}

/**
 * Trip breakdown search and filters, as in the prototype. Incomplete or
 * invalid dates and weights are ignored.
 */
export function searchCatchEntries(
  entries,
  {
    s = '',
    from = {},
    to = {},
    vessel = '',
    adminPort = '',
    species = '',
    gearType = '',
    port = '',
    weightMin = '',
    weightMax = ''
  } = {}
) {
  const term = s.trim()
  const fromDate = toIsoDate(from)
  const toDate = toIsoDate(to)
  const min = toNumber(weightMin)
  const max = toNumber(weightMax)
  const text = {
    vessel: vessel.trim(),
    adminPort: adminPort.trim(),
    species: species.trim(),
    gearType: gearType.trim(),
    port: port.trim()
  }

  return entries.filter((entry) => {
    const weight = toNumber(entry.weight)
    const checks = [
      !term ||
        anyContains(
          [
            entry.tripId,
            entry.vesselName,
            entry.pln,
            entry.species,
            entry.faoCode,
            entry.gearType,
            entry.adminPort
          ],
          term
        ),
      !text.vessel || anyContains([entry.vesselName, entry.pln], text.vessel),
      !text.adminPort || contains(entry.adminPort, text.adminPort),
      !text.species ||
        anyContains([entry.species, entry.faoCode], text.species),
      !text.gearType || contains(entry.gearType, text.gearType),
      !text.port ||
        anyContains([entry.departurePort, entry.returnPort], text.port),
      !fromDate || entry.tripEndDate >= fromDate,
      !toDate || entry.tripEndDate <= toDate,
      min === null || weight >= min,
      max === null || weight <= max
    ]
    return checks.every(Boolean)
  })
}

const longDate = (isoDate) => format(parseISO(isoDate), 'd MMMM yyyy')

/**
 * "Export trip data": the table columns followed by the extra trip details
 * the prototype adds to the download.
 */
export function catchEntriesToCsv(entries) {
  const header = [
    'Trip end date',
    'Trip ID',
    'PLN',
    'Vessel name',
    'Departure date',
    'Departure port',
    'Return port',
    'Species',
    'FAO code',
    'Gear type',
    'Weight (kg)',
    'Retained weight (kg)',
    'Admin port',
    'RSS number',
    'User ID',
    'Created by',
    'User role',
    'Created on',
    'Received on',
    'Submission method',
    'Retained catch',
    'Trip status',
    'Amendment reason',
    'Gear measurements',
    'Gear subrectangle',
    'Weight below minimum size (kg)',
    'Weight discarded (kg)',
    'Trip notes'
  ]
  const rows = entries.map((entry) => [
    longDate(entry.tripEndDate),
    entry.tripId,
    entry.pln,
    entry.vesselName,
    longDate(entry.departureDate),
    entry.departurePort,
    entry.returnPort,
    entry.species,
    entry.faoCode,
    entry.gearType,
    entry.weight,
    entry.retainedWeight,
    entry.adminPort,
    entry.rss,
    entry.userId,
    entry.createdBy,
    entry.userRole,
    entry.createdOn,
    entry.receivedOn,
    entry.submissionMethod,
    entry.retainedCatch,
    entry.tripStatus,
    entry.amendmentReason,
    entry.gearMeasurements,
    entry.gearSubrectangle,
    entry.weightBelowMinimumSize,
    entry.weightDiscarded,
    entry.tripNotes
  ])

  return toCsv([header, ...rows])
}
