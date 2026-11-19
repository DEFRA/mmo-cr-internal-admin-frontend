import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'

const PUBLIC_PATHS = ['/sign-in', '/health', '/cookies', '/favicon.ico']
const PUBLIC_PREFIXES = ['/public/', '/cookies/']

export function isPublicPath(path) {
  return (
    PUBLIC_PATHS.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix))
  )
}

/**
 * Mock authentication guard: every admin page requires a signed-in session.
 * Replace with the real identity provider integration (see ADR 0001).
 */
export const adminAuth = {
  plugin: {
    name: 'admin-auth',
    register(server) {
      server.ext('onPreHandler', (request, h) => {
        if (isPublicPath(request.path) || getAdminUser(request)) {
          return h.continue
        }

        return h.redirect('/sign-in').takeover()
      })
    }
  }
}
