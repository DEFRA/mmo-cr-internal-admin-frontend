import Boom from '@hapi/boom'

import {
  getStore,
  saveStore
} from '#/server/common/helpers/admin-store/admin-store.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { findUser } from './users-service.js'

export { flashBanner, takeBanner } from '../banner.js'

export function loadUser(request) {
  const store = getStore(request)
  const user = findUser(store, request.params.userId)

  if (!user) {
    throw Boom.notFound()
  }

  return { store, user, actor: getAdminUser(request) }
}

export function commitStore(request, store) {
  saveStore(request, store)
}

export const profilePath = (userId, hash = '') => `/users/${userId}${hash}`
