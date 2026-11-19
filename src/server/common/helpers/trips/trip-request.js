import Boom from '@hapi/boom'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { findTrip } from './trips-service.js'

/**
 * Loads a trip that has a full record (trip profile pages).
 */
export function loadTrip(request) {
  const store = getStore(request)
  const trip = findTrip(store, request.params.tripId)

  if (!trip?.hasProfile) {
    throw Boom.notFound()
  }

  return { store, trip, actor: getAdminUser(request) }
}

export const tripPath = (tripId, query = '') =>
  `/fishing-trips/${tripId}${query}`
