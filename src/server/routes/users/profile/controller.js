import {
  linkedVessels,
  statusLabel
} from '#/server/common/helpers/users/users-service.js'
import {
  loadUser,
  takeBanner
} from '#/server/common/helpers/users/user-request.js'

export const profileController = {
  handler(request, h) {
    const { store, user } = loadUser(request)

    return h.view('users/profile/index', {
      pageTitle: user.fullName,
      backLink: { text: 'Back to users', href: '/users' },
      user,
      statusText: statusLabel(user.status),
      vessels: linkedVessels(store, user),
      banner: takeBanner(request)
    })
  }
}
