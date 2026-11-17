import { validateForm } from '#/server/common/helpers/forms/validation.js'
import { saveStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { flashBanner } from '#/server/common/helpers/banner.js'
import {
  addVesselToUser,
  findUser,
  removeVesselFromUser
} from '#/server/common/helpers/users/users-service.js'
import { VESSEL_ROLES } from '#/server/common/helpers/users/constants.js'
import {
  linkableUsers,
  vesselUsers
} from '#/server/common/helpers/vessels/vessels-service.js'
import {
  addVesselUserSchema,
  removeVesselUserSchema
} from '#/server/common/helpers/vessels/schemas.js'
import {
  loadVessel,
  vesselPath
} from '#/server/common/helpers/vessels/vessel-request.js'

const backLink = (vessel) => ({
  text: `Back to ${vessel.name}`,
  href: vesselPath(vessel.id, '#users')
})

function addViewModel(store, vessel, extra = {}) {
  return {
    pageTitle: `Add a user to ${vessel.name}`,
    backLink: backLink(vessel),
    vessel,
    userOptions: linkableUsers(store, vessel).map((user) => ({
      value: user.id,
      text: `${user.fullName} (${user.id})`
    })),
    roles: VESSEL_ROLES,
    values: {},
    ...extra
  }
}

function removeViewModel(store, vessel, extra = {}) {
  return {
    pageTitle: `Remove a user from ${vessel.name}`,
    backLink: backLink(vessel),
    vessel,
    links: vesselUsers(store, vessel),
    values: {},
    ...extra
  }
}

export const addUserController = {
  handler(request, h) {
    const { store, vessel } = loadVessel(request)
    return h.view('vessels/users/add', addViewModel(store, vessel))
  }
}

export const addUserPostController = {
  handler(request, h) {
    const { store, vessel, actor } = loadVessel(request)
    const userIds = linkableUsers(store, vessel).map((user) => user.id)
    const { values, errors } = validateForm(
      addVesselUserSchema(userIds),
      request.payload,
      ['user-id', 'role']
    )

    if (errors) {
      return h.view(
        'vessels/users/add',
        addViewModel(store, vessel, {
          values: request.payload ?? {},
          ...errors
        })
      )
    }

    const user = findUser(store, values['user-id'])
    addVesselToUser(store, user, vessel.id, values.role, actor)
    saveStore(request, store)
    flashBanner(request, {
      title: 'User added to vessel',
      text: `${user.fullName} is now linked to ${vessel.name} as ${values.role}.`
    })

    return h.redirect(vesselPath(vessel.id, '#users'))
  }
}

export const removeUserController = {
  handler(request, h) {
    const { store, vessel } = loadVessel(request)
    return h.view('vessels/users/remove', removeViewModel(store, vessel))
  }
}

export const removeUserPostController = {
  handler(request, h) {
    const { store, vessel, actor } = loadVessel(request)
    const userIds = vesselUsers(store, vessel).map(({ user }) => user.id)

    if (!userIds.length) {
      return h.redirect(vesselPath(vessel.id, '#users'))
    }

    const { values, errors } = validateForm(
      removeVesselUserSchema(userIds),
      request.payload,
      ['user-id']
    )

    if (errors) {
      return h.view(
        'vessels/users/remove',
        removeViewModel(store, vessel, {
          values: request.payload ?? {},
          ...errors
        })
      )
    }

    const user = findUser(store, values['user-id'])
    removeVesselFromUser(store, user, vessel.id, actor)
    saveStore(request, store)
    flashBanner(request, {
      title: 'User removed from vessel',
      text: `${user.fullName} is no longer linked to ${vessel.name}. Their user account has not been deleted.`
    })

    return h.redirect(vesselPath(vessel.id, '#users'))
  }
}
