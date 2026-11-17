import inert from '@hapi/inert'

import { home } from '../routes/home/index.js'
import { signIn } from '../routes/sign-in/index.js'
import { signOut } from '../routes/sign-out/index.js'
import { rolePreview } from '../routes/role-preview/index.js'
import { users } from '../routes/users/index.js'
import { vessels } from '../routes/vessels/index.js'
import { fishingTrips } from '../routes/fishing-trips/index.js'
import { tripBreakdown } from '../routes/trip-breakdown/index.js'
import { auditLog } from '../routes/audit-log/index.js'
import { bannerMessage } from '../routes/banner-message/index.js'
import { tripLayouts } from '../routes/trip-layouts/index.js'
import { placeholder } from '../routes/placeholder/index.js'
import { health } from '../routes/health/index.js'
import { cookies } from '../routes/cookies/controller.js'
import { serveStaticFiles } from './serve-static-files.js'
import { config } from '#/config/config.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])
      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])
      // Cookie consent & policy page
      await server.register([cookies])

      // Application specific routes, add your own routes here
      await server.register([
        signIn,
        signOut,
        home,
        rolePreview,
        users,
        vessels,
        fishingTrips,
        tripBreakdown,
        auditLog,
        bannerMessage,
        tripLayouts,
        placeholder
      ])

      // Static assets
      if (!config.get('isProduction') && !config.get('isTest')) {
        await (async () => {
          const createViteServer = (await import('vite')).createServer
          const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'custom'
          })

          await server.register({
            plugin: (await import('@defra/hapi-connect')).default,
            options: {
              path: '/public',
              middleware: [vite.middlewares]
            }
          })
        })()
      } else {
        server.register(serveStaticFiles)
      }
    }
  }
}
