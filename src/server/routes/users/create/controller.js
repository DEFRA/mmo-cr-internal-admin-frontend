import { validateForm } from '#/server/common/helpers/forms/validation.js'
import {
  getStore,
  saveStore
} from '#/server/common/helpers/admin-store/admin-store.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { createUser } from '#/server/common/helpers/users/users-service.js'
import { loadUser } from '#/server/common/helpers/users/user-request.js'
import { ADMINISTRATIONS } from '#/server/common/helpers/users/constants.js'
import {
  USER_FIELD_ORDER,
  userDetailsSchema
} from '#/server/common/helpers/users/schemas.js'

const VIEW = 'users/create/index'
const viewModel = (extra = {}) => ({
  pageTitle: 'Create a new user',
  backLink: { text: 'Back to users', href: '/users' },
  administrations: ADMINISTRATIONS,
  values: {},
  ...extra
})

export const createController = {
  handler(_request, h) {
    return h.view(VIEW, viewModel())
  }
}

export const createPostController = {
  handler(request, h) {
    const { values, errors } = validateForm(
      userDetailsSchema({ askAssistedDigital: true }),
      request.payload,
      USER_FIELD_ORDER
    )

    if (errors) {
      return h.view(VIEW, viewModel({ values: request.payload, ...errors }))
    }

    const store = getStore(request)
    const user = createUser(store, values, getAdminUser(request))
    saveStore(request, store)

    return h.redirect(`/users/create/confirmation/${user.id}`)
  }
}

export const confirmationController = {
  handler(request, h) {
    const { user } = loadUser(request)

    return h.view('users/create/confirmation', {
      pageTitle: 'User created',
      backLink: { text: 'Back to users', href: '/users' },
      user
    })
  }
}
