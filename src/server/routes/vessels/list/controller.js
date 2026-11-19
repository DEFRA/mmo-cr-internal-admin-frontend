import Joi from 'joi'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import {
  searchVessels,
  vesselsToCsv
} from '#/server/common/helpers/vessels/vessels-service.js'
import {
  VESSEL_STATUSES,
  VESSELS_PAGE_SIZE
} from '#/server/common/helpers/vessels/constants.js'
import { exportHref } from '#/server/common/helpers/csv/csv.js'
import { ADMINISTRATION_FILTER_ORDER } from '#/server/common/helpers/users/constants.js'
import {
  buildPagination,
  paginate
} from '#/server/common/helpers/forms/pagination.js'

const listOf = (values) =>
  Joi.array()
    .items(Joi.string().valid(...values))
    .single()
    .default([])

const querySchema = Joi.object({
  s: Joi.string().trim().allow('').max(100).default(''),
  vessel: Joi.string().trim().allow('').max(100).default(''),
  'admin-port': Joi.string().trim().allow('').max(100).default(''),
  status: listOf(VESSEL_STATUSES.map((status) => status.value)),
  administration: listOf(ADMINISTRATION_FILTER_ORDER),
  page: Joi.number().integer().min(1).default(1)
})

const validateQuery = {
  query: querySchema,
  failAction: (_request, h) => h.redirect('/vessels').takeover()
}

const matchingVessels = (request) =>
  searchVessels(getStore(request).vessels, {
    s: request.query.s,
    vessel: request.query.vessel,
    adminPort: request.query['admin-port'],
    status: request.query.status,
    administration: request.query.administration
  })

function filterGroups(query) {
  const checked = (options, selected) =>
    options.map(({ value, text }) => ({
      value,
      text,
      checked: selected.includes(value)
    }))

  return [
    {
      type: 'text',
      name: 'vessel',
      legend: 'Vessel',
      hint: 'Search by vessel name or PLN',
      value: query.vessel
    },
    {
      type: 'text',
      name: 'admin-port',
      legend: 'Admin port',
      value: query['admin-port']
    },
    {
      name: 'status',
      legend: 'Status',
      inline: true,
      items: checked(VESSEL_STATUSES, query.status)
    },
    {
      name: 'administration',
      legend: 'Administration',
      items: checked(
        ADMINISTRATION_FILTER_ORDER.map((value) => ({ value, text: value })),
        query.administration
      )
    }
  ]
}

export const listController = {
  options: { validate: validateQuery },
  handler(request, h) {
    const { query } = request
    const { items, page, totalPages } = paginate(
      matchingVessels(request),
      query.page,
      VESSELS_PAGE_SIZE
    )

    return h.view('vessels/list/index', {
      pageTitle: 'Vessels',
      vessels: items,
      search: query.s,
      exportHref: exportHref('/vessels/export', query),
      filters: { groups: filterGroups(query), clearHref: '/vessels' },
      pagination: buildPagination({
        basePath: '/vessels',
        query,
        page,
        totalPages
      })
    })
  }
}

/**
 * "Export vessel data": CSV of the vessels matching the current search and filters.
 */
export const exportController = {
  options: { validate: validateQuery },
  handler(request, h) {
    return h
      .response(vesselsToCsv(matchingVessels(request)))
      .type('text/csv; charset=utf-8')
      .header('content-disposition', 'attachment; filename="vessels.csv"')
  }
}
