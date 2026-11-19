import Joi from 'joi'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import {
  TRIP_BREAKDOWN_PAGE_SIZE,
  allCatchEntries,
  catchEntriesToCsv,
  searchCatchEntries
} from '#/server/common/helpers/trip-breakdown/breakdown-service.js'
import { exportHref } from '#/server/common/helpers/csv/csv.js'
import {
  buildPagination,
  paginate
} from '#/server/common/helpers/forms/pagination.js'

const text = Joi.string().trim().allow('').max(100).default('')
const shortText = Joi.string().trim().allow('').max(10).default('')

const querySchema = Joi.object({
  s: text,
  'trip-end-date-from-day': shortText,
  'trip-end-date-from-month': shortText,
  'trip-end-date-from-year': shortText,
  'trip-end-date-to-day': shortText,
  'trip-end-date-to-month': shortText,
  'trip-end-date-to-year': shortText,
  vessel: text,
  'admin-port': text,
  species: text,
  'gear-type': text,
  port: text,
  'weight-min': shortText,
  'weight-max': shortText,
  page: Joi.number().integer().min(1).default(1)
})

const validateQuery = {
  query: querySchema,
  failAction: (_request, h) => h.redirect('/trip-breakdown').takeover()
}

const datePart = (query, prefix) => ({
  day: query[`${prefix}-day`],
  month: query[`${prefix}-month`],
  year: query[`${prefix}-year`]
})

const dateRange = (query) => ({
  from: datePart(query, 'trip-end-date-from'),
  to: datePart(query, 'trip-end-date-to')
})

const matchingEntries = (query) =>
  searchCatchEntries(allCatchEntries(), {
    s: query.s,
    ...dateRange(query),
    vessel: query.vessel,
    adminPort: query['admin-port'],
    species: query.species,
    gearType: query['gear-type'],
    port: query.port,
    weightMin: query['weight-min'],
    weightMax: query['weight-max']
  })

const textFilter = (query, name, legend, hint) => ({
  type: 'text',
  name,
  legend,
  hint,
  value: query[name]
})

function filterGroups(query) {
  return [
    {
      type: 'date-range',
      name: 'trip-end-date',
      legend: 'Trip end date',
      value: dateRange(query)
    },
    textFilter(query, 'vessel', 'Vessel', 'Search by vessel name or PLN'),
    textFilter(query, 'admin-port', 'Admin port'),
    textFilter(query, 'species', 'Species or FAO code'),
    textFilter(query, 'gear-type', 'Gear type'),
    textFilter(query, 'port', 'Port'),
    {
      type: 'number-range',
      name: 'weight',
      legend: 'Weight (kg)',
      parts: [
        { key: 'min', text: 'Minimum', value: query['weight-min'] },
        { key: 'max', text: 'Maximum', value: query['weight-max'] }
      ]
    }
  ]
}

export const listController = {
  options: { validate: validateQuery },
  handler(request, h) {
    const { query } = request
    const { items, page, totalPages } = paginate(
      matchingEntries(query),
      query.page,
      TRIP_BREAKDOWN_PAGE_SIZE
    )
    const tripsWithProfiles = getStore(request)
      .trips.filter((trip) => trip.hasProfile)
      .map((trip) => trip.tripId)

    return h.view('trip-breakdown/index', {
      pageTitle: 'Trip breakdown',
      entries: items,
      tripsWithProfiles,
      search: query.s,
      exportHref: exportHref('/trip-breakdown/export', query),
      filters: { groups: filterGroups(query), clearHref: '/trip-breakdown' },
      pagination: buildPagination({
        basePath: '/trip-breakdown',
        query,
        page,
        totalPages
      })
    })
  }
}

/**
 * "Export trip data": CSV of the catch entries matching the current search
 * and filters.
 */
export const exportController = {
  options: { validate: validateQuery },
  handler(request, h) {
    return h
      .response(catchEntriesToCsv(matchingEntries(request.query)))
      .type('text/csv; charset=utf-8')
      .header(
        'content-disposition',
        'attachment; filename="trip-breakdown.csv"'
      )
  }
}
