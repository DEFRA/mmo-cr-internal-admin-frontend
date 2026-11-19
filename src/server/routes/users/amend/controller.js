import { validateForm } from '#/server/common/helpers/forms/validation.js'
import {
  amendUser,
  userToForm
} from '#/server/common/helpers/users/users-service.js'
import {
  commitStore,
  flashBanner,
  loadUser,
  profilePath
} from '#/server/common/helpers/users/user-request.js'
import { ADMINISTRATIONS } from '#/server/common/helpers/users/constants.js'
import {
  USER_FIELD_ORDER,
  userDetailsSchema
} from '#/server/common/helpers/users/schemas.js'

const VIEW = 'users/amend/index'

const viewModel = (user, extra) => ({
  pageTitle: 'Amend user',
  backLink: { text: 'Back to users', href: '/users' },
  administrations: ADMINISTRATIONS,
  user,
  ...extra
})

export const amendController = {
  handler(request, h) {
    const { user } = loadUser(request)
    return h.view(VIEW, viewModel(user, { values: userToForm(user) }))
  }
}

export const amendPostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)
    const schema = userDetailsSchema({
      askAssistedDigital: false,
      assistedDigital: user.assistedDigital
    })
    const { values, errors } = validateForm(
      schema,
      request.payload,
      USER_FIELD_ORDER
    )

    if (errors) {
      return h.view(
        VIEW,
        viewModel(user, { values: request.payload ?? {}, ...errors })
      )
    }

    amendUser(user, values, actor)
    commitStore(request, store)
    flashBanner(request, { title: 'User details updated' })

    return h.redirect(profilePath(user.id))
  }
}
