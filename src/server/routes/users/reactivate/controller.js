import {
  reactivateUser,
  statusLabel
} from '#/server/common/helpers/users/users-service.js'
import {
  commitStore,
  flashBanner,
  loadUser,
  profilePath
} from '#/server/common/helpers/users/user-request.js'

export const reactivateController = {
  handler(request, h) {
    const { user } = loadUser(request)

    if (user.status !== 'deactivated') {
      return h.redirect(profilePath(user.id))
    }

    return h.view('users/reactivate/index', {
      pageTitle: `Reactivate ${user.fullName}?`,
      backLink: {
        text: `Back to ${user.fullName}’s profile`,
        href: profilePath(user.id)
      },
      user,
      statusText: statusLabel(user.status)
    })
  }
}

export const reactivatePostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)

    // The prototype's own submit is broken, so this mirrors "Deactivate user"
    if (user.status === 'deactivated') {
      reactivateUser(user, actor)
      commitStore(request, store)
      flashBanner(request, {
        title: 'User reactivated',
        text: `${user.fullName} can access the service again.`
      })
    }

    return h.redirect(profilePath(user.id))
  }
}
