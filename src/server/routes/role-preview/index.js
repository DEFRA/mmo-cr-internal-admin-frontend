import Joi from 'joi'

import {
  ADMIN_ROLES,
  setAdminRole
} from '#/server/common/helpers/admin-auth/admin-user.js'

/**
 * Prototype helper: switches the signed-in user's role so role-based views
 * can be previewed. Permissions follow the prototype (see permissions.js).
 */
export const rolePreview = {
  plugin: {
    name: 'role-preview',
    register(server) {
      server.route({
        method: 'GET',
        path: '/role-preview/{role}',
        options: {
          validate: {
            params: Joi.object({
              role: Joi.string().valid(...ADMIN_ROLES.map((role) => role.key))
            })
          }
        },
        handler(request, h) {
          const role = ADMIN_ROLES.find(
            (item) => item.key === request.params.role
          )
          setAdminRole(request, role.name)
          return h.redirect('/users')
        }
      })
    }
  }
}
