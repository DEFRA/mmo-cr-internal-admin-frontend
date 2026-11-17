import Boom from '@hapi/boom'
import Joi from 'joi'

import {
  submissionMethod,
  tripVersion
} from '#/server/common/helpers/trips/trips-service.js'
import { TRIP_HISTORY_PAGE_SIZE } from '#/server/common/helpers/trips/constants.js'
import {
  loadTrip,
  tripPath
} from '#/server/common/helpers/trips/trip-request.js'
import {
  buildPagination,
  paginate
} from '#/server/common/helpers/forms/pagination.js'

// Trip details layout testing shows the example trip with a subset of its gears
// (prototype `gearExample`)
export const GEAR_EXAMPLES = {
  'pots-trammel': ['Pots', 'Trammel net']
}

const querySchema = Joi.object({
  version: Joi.string()
    .pattern(/^(original|current|amendment-\d+)$/)
    .optional(),
  'history-page': Joi.number().integer().min(1).default(1),
  'gear-example': Joi.string()
    .valid(...Object.keys(GEAR_EXAMPLES))
    .optional(),
  // Layout testing Option 2: show "Other trip information" in the main list
  information: Joi.string().valid('all').optional()
})

function versionNotice(trip, view) {
  const versionsHref = tripPath(trip.tripId, '/versions')

  if (view.kind === 'original') {
    return {
      text: `Original record submitted by ${trip.createdBy} on`,
      dateTime: trip.createdOn
    }
  }
  if (!view.amendment) {
    return null
  }

  const label = `Amendment ${view.amendment.number}${view.isCurrent ? ' (current)' : ''}`
  if (view.kind === 'latest') {
    return {
      text: `You are viewing ${label}.`,
      linkText: 'View amended records',
      href: versionsHref
    }
  }
  if (view.isCurrent) {
    return {
      text: `You are viewing ${label}.`,
      linkText: 'Return to trip details',
      href: tripPath(trip.tripId)
    }
  }
  return {
    text: `You are viewing ${label}.`,
    linkText: 'Return to amended records',
    href: versionsHref
  }
}

export const profileController = {
  options: {
    validate: {
      query: querySchema,
      failAction: (request, h) =>
        h.redirect(tripPath(request.params.tripId)).takeover()
    }
  },
  handler(request, h) {
    const { store, trip } = loadTrip(request)
    const { query } = request
    const requested =
      query.version === 'current'
        ? `amendment-${trip.amendments.at(-1)?.number}`
        : query.version
    const view = tripVersion(trip, requested)

    if (!view) {
      throw Boom.notFound()
    }

    const exampleGears = GEAR_EXAMPLES[query['gear-example']]
    if (exampleGears) {
      view.gears = view.gears.filter((gear) => exampleGears.includes(gear.name))
    }

    const history = paginate(
      trip.history,
      query['history-page'],
      TRIP_HISTORY_PAGE_SIZE
    )
    const creator = store.users.find((user) => user.fullName === trip.createdBy)

    return h.view('fishing-trips/profile/index', {
      pageTitle: `Trip ${trip.tripId}`,
      backLink: { text: 'Back to fishing trips', href: '/fishing-trips' },
      trip,
      view: { ...view, isVersionView: Boolean(query.version) },
      caption:
        view.kind === 'original' ? 'Original submitted record' : 'Trip details',
      notice: versionNotice(
        trip,
        query.version === 'current' ? { ...view, kind: 'version' } : view
      ),
      creatorHref: creator ? `/users/${creator.id}` : null,
      methodLabel: submissionMethod(trip.submissionMethod)?.label,
      showAllInformation: query.information === 'all',
      hasAmendments: trip.amendments.length > 0,
      history: history.items,
      historyPagination: buildPagination({
        basePath: tripPath(trip.tripId),
        query,
        page: history.page,
        totalPages: history.totalPages,
        pageParam: 'history-page',
        hash: '#history'
      })
    })
  }
}
