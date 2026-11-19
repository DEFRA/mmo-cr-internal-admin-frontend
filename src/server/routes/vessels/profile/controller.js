import Joi from 'joi'

import {
  filterVesselTrips,
  toIsoDate,
  vesselStatusLabel,
  vesselUsers
} from '#/server/common/helpers/vessels/vessels-service.js'
import {
  TRIP_STATUSES,
  VESSEL_HISTORY_PAGE_SIZE
} from '#/server/common/helpers/vessels/constants.js'
import {
  loadVessel,
  vesselPath
} from '#/server/common/helpers/vessels/vessel-request.js'
import { takeBanner } from '#/server/common/helpers/banner.js'
import {
  buildPagination,
  paginate
} from '#/server/common/helpers/forms/pagination.js'

const datePart = Joi.string().trim().allow('').max(4).default('')

const querySchema = Joi.object({
  'trip-end-date-day': datePart,
  'trip-end-date-month': datePart,
  'trip-end-date-year': datePart,
  user: Joi.string().trim().allow('').max(100).default(''),
  status: Joi.array()
    .items(Joi.string().valid(...TRIP_STATUSES.map((status) => status.value)))
    .single()
    .default([]),
  'history-page': Joi.number().integer().min(1).default(1)
})

function tripFilterGroups(query, date) {
  return [
    {
      type: 'date',
      name: 'trip-end-date',
      legend: 'Trip end date',
      value: date
    },
    { type: 'text', name: 'user', legend: 'User', value: query.user },
    {
      name: 'status',
      legend: 'Status',
      items: TRIP_STATUSES.map(({ value, text }) => ({
        value,
        text,
        checked: query.status.includes(value)
      }))
    }
  ]
}

export const profileController = {
  options: {
    validate: {
      query: querySchema,
      failAction: (request, h) =>
        h.redirect(vesselPath(request.params.vesselId)).takeover()
    }
  },
  handler(request, h) {
    const { store, vessel } = loadVessel(request)
    const { query } = request

    const date = {
      day: query['trip-end-date-day'],
      month: query['trip-end-date-month'],
      year: query['trip-end-date-year']
    }
    const trips = filterVesselTrips(vessel.trips, {
      date: toIsoDate(date),
      user: query.user,
      status: query.status
    })

    const history = paginate(
      vessel.history,
      query['history-page'],
      VESSEL_HISTORY_PAGE_SIZE
    )

    return h.view('vessels/profile/index', {
      pageTitle: vessel.name,
      backLink: { text: 'Back to vessels', href: '/vessels' },
      vessel,
      statusText: vesselStatusLabel(vessel.status),
      users: vesselUsers(store, vessel),
      trips,
      tripsWithProfiles: store.trips
        .filter((trip) => trip.hasProfile)
        .map((trip) => trip.tripId),
      tripFilters: {
        idPrefix: 'trip',
        groups: tripFilterGroups(query, date),
        clearHref: vesselPath(vessel.id, '#fishing-trips')
      },
      history: history.items,
      historyPagination: buildPagination({
        basePath: vesselPath(vessel.id),
        query,
        page: history.page,
        totalPages: history.totalPages,
        pageParam: 'history-page',
        hash: '#history'
      }),
      banner: takeBanner(request)
    })
  }
}
