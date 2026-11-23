import {
  linkedVessels,
  statusLabel
} from '#/server/common/helpers/users/users-service.js'
import {
  loadUser,
  takeBanner
} from '#/server/common/helpers/users/user-request.js'
import { listHref } from '#/server/common/helpers/search-state.js'

export const profileController = {
  handler(request, h) {
    const { store, user } = loadUser(request)

    return h.view('users/profile/index', {
      pageTitle: user.fullName,
      backLink: { text: 'Back to users', href: listHref(request, '/users') },
      user,
      statusText: statusLabel(user.status),
      vessels: linkedVessels(store, user),
      // Trips this user created, newest first (as in the prototype)
      trips: store.trips
        .filter((trip) => trip.createdBy === user.fullName)
        .sort((a, b) => b.tripEndDate.localeCompare(a.tripEndDate)),
      banner: takeBanner(request)
    })
  }
}
