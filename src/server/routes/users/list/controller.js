import Joi from 'joi'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { searchUsers } from '#/server/common/helpers/users/users-service.js'
import {
  ADMINISTRATION_FILTER_ORDER,
  USER_STATUSES,
  USERS_PAGE_SIZE
} from '#/server/common/helpers/users/constants.js'
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
  status: listOf(USER_STATUSES.map((status) => status.value)),
  'assisted-digital': listOf(['yes', 'no']),
  administration: listOf(ADMINISTRATION_FILTER_ORDER),
  page: Joi.number().integer().min(1).default(1)
})

const checkboxItems = (options, selected) =>
  options.map(({ value, text }) => ({
    value,
    text,
    checked: selected.includes(value)
  }))

function filterGroups(query) {
  return [
    {
      name: 'status',
      legend: 'Status',
      items: checkboxItems(USER_STATUSES, query.status)
    },
    {
      name: 'assisted-digital',
      legend: 'Assisted digital',
      inline: true,
      items: checkboxItems(
        [
          { value: 'yes', text: 'Yes' },
          { value: 'no', text: 'No' }
        ],
        query['assisted-digital']
      )
    },
    {
      name: 'administration',
      legend: 'Administration',
      items: checkboxItems(
        ADMINISTRATION_FILTER_ORDER.map((value) => ({ value, text: value })),
        query.administration
      )
    }
  ]
}

export const listController = {
  options: {
    validate: {
      query: querySchema,
      failAction: (_request, h) => h.redirect('/users').takeover()
    }
  },
  handler(request, h) {
    const { query } = request
    const store = getStore(request)

    const matches = searchUsers(store.users, {
      s: query.s,
      status: query.status,
      assistedDigital: query['assisted-digital'],
      administration: query.administration
    })
    const { items, page, totalPages } = paginate(
      matches,
      query.page,
      USERS_PAGE_SIZE
    )

    return h.view('users/list/index', {
      pageTitle: 'Users',
      users: items,
      search: query.s,
      filters: { groups: filterGroups(query), clearHref: '/users' },
      pagination: buildPagination({
        basePath: '/users',
        query,
        page,
        totalPages
      })
    })
  }
}
