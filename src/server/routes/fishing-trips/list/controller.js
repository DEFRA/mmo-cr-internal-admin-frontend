import Joi from 'joi'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { searchTrips } from '#/server/common/helpers/trips/trips-service.js'
import {
  SUBMISSION_METHODS,
  TRIPS_PAGE_SIZE
} from '#/server/common/helpers/trips/constants.js'
import { TRIP_STATUSES } from '#/server/common/helpers/vessels/constants.js'
import {
  buildPagination,
  paginate
} from '#/server/common/helpers/forms/pagination.js'

const text = Joi.string().trim().allow('').max(100).default('')
const datePart = Joi.string().trim().allow('').max(4).default('')
const listOf = (values) =>
  Joi.array()
    .items(Joi.string().valid(...values))
    .single()
    .default([])

const querySchema = Joi.object({
  s: text,
  'trip-end-date-from-day': datePart,
  'trip-end-date-from-month': datePart,
  'trip-end-date-from-year': datePart,
  'trip-end-date-to-day': datePart,
  'trip-end-date-to-month': datePart,
  'trip-end-date-to-year': datePart,
  vessel: text,
  'created-by': text,
  status: listOf(TRIP_STATUSES.map((status) => status.value)),
  'submission-method': listOf(SUBMISSION_METHODS.map((method) => method.value)),
  page: Joi.number().integer().min(1).default(1)
})

const dateFrom = (query, prefix) => ({
  day: query[`${prefix}-day`],
  month: query[`${prefix}-month`],
  year: query[`${prefix}-year`]
})

const checked = (options, selected) =>
  options.map(({ value, text: label }) => ({
    value,
    text: label,
    checked: selected.includes(value)
  }))

function filterGroups(query, range) {
  return [
    {
      type: 'date-range',
      name: 'trip-end-date',
      legend: 'Trip end date',
      value: range
    },
    {
      type: 'text',
      name: 'vessel',
      legend: 'Vessel',
      hint: 'Search by vessel name, PLN or RSS number',
      value: query.vessel
    },
    {
      type: 'text',
      name: 'created-by',
      legend: 'Created by',
      value: query['created-by']
    },
    {
      name: 'status',
      legend: 'Status',
      items: checked(TRIP_STATUSES, query.status)
    },
    {
      name: 'submission-method',
      legend: 'Submission method',
      items: checked(SUBMISSION_METHODS, query['submission-method'])
    }
  ]
}

export const listController = {
  options: {
    validate: {
      query: querySchema,
      failAction: (_request, h) => h.redirect('/fishing-trips').takeover()
    }
  },
  handler(request, h) {
    const { query } = request
    const range = {
      from: dateFrom(query, 'trip-end-date-from'),
      to: dateFrom(query, 'trip-end-date-to')
    }
    const trips = searchTrips(getStore(request).trips, {
      s: query.s,
      from: range.from,
      to: range.to,
      vessel: query.vessel,
      createdBy: query['created-by'],
      status: query.status,
      submissionMethod: query['submission-method']
    })
    const { items, page, totalPages } = paginate(
      trips,
      query.page,
      TRIPS_PAGE_SIZE
    )

    return h.view('fishing-trips/list/index', {
      pageTitle: 'Fishing trips',
      trips: items,
      search: query.s,
      filters: {
        groups: filterGroups(query, range),
        clearHref: '/fishing-trips'
      },
      pagination: buildPagination({
        basePath: '/fishing-trips',
        query,
        page,
        totalPages
      })
    })
  }
}
