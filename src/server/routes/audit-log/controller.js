import Joi from 'joi'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import {
  AUDIT_LOG_PAGE_SIZE,
  RECORD_TYPES,
  allAuditEntries,
  auditEntryLinks,
  recordTypeText,
  searchAuditEntries
} from '#/server/common/helpers/audit-log/audit-log-service.js'
import {
  buildPagination,
  paginate
} from '#/server/common/helpers/forms/pagination.js'

const text = Joi.string().trim().allow('').max(100).default('')
const datePart = Joi.string().trim().allow('').max(4).default('')

const querySchema = Joi.object({
  s: text,
  'date-from-day': datePart,
  'date-from-month': datePart,
  'date-from-year': datePart,
  'date-to-day': datePart,
  'date-to-month': datePart,
  'date-to-year': datePart,
  'performed-by': text,
  'record-type': Joi.array()
    .items(Joi.string().valid(...RECORD_TYPES.map((type) => type.value)))
    .single()
    .default([]),
  page: Joi.number().integer().min(1).default(1)
})

const dateFrom = (query, prefix) => ({
  day: query[`${prefix}-day`],
  month: query[`${prefix}-month`],
  year: query[`${prefix}-year`]
})

function filterGroups(query, from, to) {
  return [
    { type: 'date', name: 'date-from', legend: 'Date from', value: from },
    { type: 'date', name: 'date-to', legend: 'Date to', value: to },
    {
      type: 'text',
      name: 'performed-by',
      legend: 'Performed by',
      value: query['performed-by']
    },
    {
      name: 'record-type',
      legend: 'Record type',
      items: RECORD_TYPES.map(({ value, text: label }) => ({
        value,
        text: label,
        checked: query['record-type'].includes(value)
      }))
    }
  ]
}

export const listController = {
  options: {
    validate: {
      query: querySchema,
      failAction: (_request, h) => h.redirect('/audit-log').takeover()
    }
  },
  handler(request, h) {
    const { query } = request
    const store = getStore(request)
    const from = dateFrom(query, 'date-from')
    const to = dateFrom(query, 'date-to')
    const { items, page, totalPages } = paginate(
      searchAuditEntries(allAuditEntries(), {
        s: query.s,
        from,
        to,
        performedBy: query['performed-by'],
        recordType: query['record-type']
      }),
      query.page,
      AUDIT_LOG_PAGE_SIZE
    )

    return h.view('audit-log/index', {
      pageTitle: 'Audit log',
      entries: items.map((entry) => ({
        ...entry,
        recordTypeText: recordTypeText(entry.recordType),
        ...auditEntryLinks(entry, store)
      })),
      search: query.s,
      filters: {
        groups: filterGroups(query, from, to),
        clearHref: '/audit-log',
        // A "view all history" link for a staff member opens the filters, as in the prototype
        open: Boolean(query['performed-by'])
      },
      pagination: buildPagination({
        basePath: '/audit-log',
        query,
        page,
        totalPages
      })
    })
  }
}
