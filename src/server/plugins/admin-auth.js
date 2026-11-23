import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import {
  permissionsFor,
  requiredPermission
} from '#/server/common/helpers/admin-auth/permissions.js'
import { rememberSearch } from '#/server/common/helpers/search-state.js'

const PUBLIC_PATHS = ['/sign-in', '/health', '/cookies', '/favicon.ico']
const PUBLIC_PREFIXES = ['/public/', '/cookies/']

export function isPublicPath(path) {
  return (
    PUBLIC_PATHS.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
  )
}

/**
 * Mock authentication guard: every admin page requires a signed-in session,
 * and role-restricted pages require the matching permission.
 * Replace with the real identity provider integration (see ADR 0001).
 */
export const adminAuth = {
  plugin: {
    name: 'admin-auth',
    register(server) {
      server.ext('onPreHandler', (request, h) => {
        if (isPublicPath(request.path)) {
          return h.continue
        }

        const user = getAdminUser(request)
        if (!user) {
          return h.redirect('/sign-in').takeover()
        }

        // As in the prototype, pages the role cannot use send it back to Users
        const permission = requiredPermission(request.path)
        if (permission && !permissionsFor(user)[permission]) {
          return h.redirect('/users').takeover()
        }

        rememberSearch(request)
        return h.continue
      })
    }
  }
}
