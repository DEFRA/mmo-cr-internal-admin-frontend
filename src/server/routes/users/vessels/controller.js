import { validateForm } from '#/server/common/helpers/forms/validation.js'
import {
  addVesselToUser,
  availableVessels,
  linkedVessels,
  removeVesselFromUser
} from '#/server/common/helpers/users/users-service.js'
import {
  commitStore,
  flashBanner,
  loadUser,
  profilePath
} from '#/server/common/helpers/users/user-request.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { linkRolesFor } from '#/server/common/helpers/admin-auth/permissions.js'
import {
  addVesselSchema,
  removeVesselSchema
} from '#/server/common/helpers/users/schemas.js'

const vesselOption = (vessel) => ({
  value: vessel.id,
  text: `${vessel.name} (${vessel.pln})`
})

const backLink = (user) => ({
  text: 'Back to user profile',
  href: profilePath(user.id)
})

const rolesFor = (request) => linkRolesFor(getAdminUser(request))

// Links the signed-in user may remove (FDST: skipper links only)
const removableLinks = (request, store, user) => {
  const roles = rolesFor(request)
  return linkedVessels(store, user).filter((link) => roles.includes(link.role))
}

function addViewModel(request, store, user, extra = {}) {
  const roles = rolesFor(request)
  return {
    pageTitle: 'Add a vessel',
    backLink: backLink(user),
    user,
    vesselOptions: availableVessels(store, user).map(vesselOption),
    roles,
    values: { role: roles[0] },
    ...extra
  }
}

function removeViewModel(request, store, user, extra = {}) {
  return {
    pageTitle: 'Remove a vessel',
    backLink: backLink(user),
    user,
    vesselOptions: removableLinks(request, store, user).map((link) =>
      vesselOption(link.vessel)
    ),
    values: {},
    ...extra
  }
}

export const addVesselController = {
  handler(request, h) {
    const { store, user } = loadUser(request)
    return h.view('users/vessels/add', addViewModel(request, store, user))
  }
}

export const addVesselPostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)
    const vesselIds = availableVessels(store, user).map((vessel) => vessel.id)
    const { values, errors } = validateForm(
      addVesselSchema(vesselIds),
      request.payload,
      ['vessel', 'role']
    )

    if (errors) {
      return h.view(
        'users/vessels/add',
        addViewModel(request, store, user, {
          values: request.payload ?? {},
          ...errors
        })
      )
    }

    const roles = rolesFor(request)
    const role = roles.includes(values.role) ? values.role : roles[0]
    addVesselToUser(store, user, values.vessel, role, actor)
    commitStore(request, store)
    flashBanner(request, { title: 'Vessel added' })

    return h.redirect(profilePath(user.id))
  }
}

export const removeVesselController = {
  handler(request, h) {
    const { store, user } = loadUser(request)
    return h.view('users/vessels/remove', removeViewModel(request, store, user))
  }
}

export const removeVesselPostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)
    const vesselIds = removableLinks(request, store, user).map(
      (link) => link.vessel.id
    )

    if (!vesselIds.length) {
      return h.redirect(profilePath(user.id))
    }

    const { values, errors } = validateForm(
      removeVesselSchema(vesselIds),
      request.payload,
      ['vessel']
    )

    if (errors) {
      return h.view(
        'users/vessels/remove',
        removeViewModel(request, store, user, {
          values: request.payload ?? {},
          ...errors
        })
      )
    }

    removeVesselFromUser(store, user, values.vessel, actor)
    commitStore(request, store)
    flashBanner(request, { title: 'Vessel removed' })

    return h.redirect(profilePath(user.id))
  }
}
