import Boom from '@hapi/boom'

import { getStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { findVesselById } from './vessels-service.js'

export function loadVessel(request) {
  const store = getStore(request)
  const vessel = findVesselById(store, request.params.vesselId)

  if (!vessel) {
    throw Boom.notFound()
  }

  return { store, vessel, actor: getAdminUser(request) }
}

export const vesselPath = (vesselId, hash = '') => `/vessels/${vesselId}${hash}`
