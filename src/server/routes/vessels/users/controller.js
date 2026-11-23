import { validateForm } from '#/server/common/helpers/forms/validation.js'
import { saveStore } from '#/server/common/helpers/admin-store/admin-store.js'
import { flashBanner } from '#/server/common/helpers/banner.js'
import {
  addVesselToUser,
  findUser,
  removeVesselFromUser
} from '#/server/common/helpers/users/users-service.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { linkRolesFor } from '#/server/common/helpers/admin-auth/permissions.js'
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

const rolesFor = (request) => linkRolesFor(getAdminUser(request))

// Links the signed-in user may remove (FDST: skipper links only)
const removableLinks = (request, store, vessel) => {
  const roles = rolesFor(request)
  return vesselUsers(store, vessel).filter((link) => roles.includes(link.role))
}

function addViewModel(request, store, vessel, extra = {}) {
  return {
    pageTitle: `Add a user to ${vessel.name}`,
    backLink: backLink(vessel),
    vessel,
    userOptions: linkableUsers(store, vessel).map((user) => ({
      value: user.id,
      text: `${user.fullName} (${user.id})`
    })),
    roles: rolesFor(request),
    values: {},
    ...extra
  }
}

function removeViewModel(request, store, vessel, extra = {}) {
  return {
    pageTitle: `Remove a user from ${vessel.name}`,
    backLink: backLink(vessel),
    vessel,
    links: removableLinks(request, store, vessel),
    values: {},
    ...extra
  }
}

export const addUserController = {
  handler(request, h) {
    const { store, vessel } = loadVessel(request)
    return h.view('vessels/users/add', addViewModel(request, store, vessel))
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
        addViewModel(request, store, vessel, {
          values: request.payload ?? {},
          ...errors
        })
      )
    }

    const user = findUser(store, values['user-id'])
    const roles = rolesFor(request)
    const role = roles.includes(values.role) ? values.role : roles[0]
    addVesselToUser(store, user, vessel.id, role, actor)
    saveStore(request, store)
    flashBanner(request, {
      title: 'User added to vessel',
      text: `${user.fullName} is now linked to ${vessel.name} as ${role}.`
    })

    return h.redirect(vesselPath(vessel.id, '#users'))
  }
}

export const removeUserController = {
  handler(request, h) {
    const { store, vessel } = loadVessel(request)
    return h.view(
      'vessels/users/remove',
      removeViewModel(request, store, vessel)
    )
  }
}

export const removeUserPostController = {
  handler(request, h) {
    const { store, vessel, actor } = loadVessel(request)
    const userIds = removableLinks(request, store, vessel).map(
      ({ user }) => user.id
    )

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
        removeViewModel(request, store, vessel, {
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
