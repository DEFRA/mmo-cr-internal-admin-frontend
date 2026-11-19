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
import { VESSEL_ROLES } from '#/server/common/helpers/users/constants.js'
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

function addViewModel(store, user, extra = {}) {
  return {
    pageTitle: 'Add a vessel',
    backLink: backLink(user),
    user,
    vesselOptions: availableVessels(store, user).map(vesselOption),
    roles: VESSEL_ROLES,
    values: { role: VESSEL_ROLES[0] },
    ...extra
  }
}

function removeViewModel(store, user, extra = {}) {
  return {
    pageTitle: 'Remove a vessel',
    backLink: backLink(user),
    user,
    vesselOptions: linkedVessels(store, user).map((link) =>
      vesselOption(link.vessel)
    ),
    values: {},
    ...extra
  }
}

export const addVesselController = {
  handler(request, h) {
    const { store, user } = loadUser(request)
    return h.view('users/vessels/add', addViewModel(store, user))
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
        addViewModel(store, user, { values: request.payload ?? {}, ...errors })
      )
    }

    addVesselToUser(store, user, values.vessel, values.role, actor)
    commitStore(request, store)
    flashBanner(request, { title: 'Vessel added' })

    return h.redirect(profilePath(user.id))
  }
}

export const removeVesselController = {
  handler(request, h) {
    const { store, user } = loadUser(request)
    return h.view('users/vessels/remove', removeViewModel(store, user))
  }
}

export const removeVesselPostController = {
  handler(request, h) {
    const { store, user, actor } = loadUser(request)
    const vesselIds = user.vessels.map((link) => link.vesselId)

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
        removeViewModel(store, user, {
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
