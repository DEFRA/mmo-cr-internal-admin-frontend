import {
  deactivateUser,
  statusLabel
} from '#/server/common/helpers/users/users-service.js'
import {
  commitStore,
  flashBanner,
  loadUser,
  profilePath
} from '#/server/common/helpers/users/user-request.js'

export const deactivateController = {
  handler(request, h) {
    const { user } = loadUser(request)

    if (user.status === 'deactivated') {
      return h.redirect(profilePath(user.id))
    }

    return h.view('users/deactivate/index', {
      pageTitle: `Deactivate ${user.fullName}?`,
      backLink: {
        text: `Back to ${user.fullName}’s profile`,
        href: profilePath(user.id)
      },
      user,
      statusText: statusLabel(user.status)
    })
  }
}

export const deactivatePostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)

    if (user.status !== 'deactivated') {
      deactivateUser(user, actor)
      commitStore(request, store)
      flashBanner(request, {
        title: 'User deactivated',
        text: `${user.fullName} can no longer access the service. Their records have been kept.`
      })
    }

    return h.redirect(profilePath(user.id))
  }
}
