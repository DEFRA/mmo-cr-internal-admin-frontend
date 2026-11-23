import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '#/config/config.js'
import { buildNavigation } from './build-navigation.js'
import { getAdminUser } from '#/server/common/helpers/admin-auth/admin-user.js'
import { permissionsFor } from '#/server/common/helpers/admin-auth/permissions.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/.vite/manifest.json'
)

const googleTagManagerKey = config.get('googleAnalytics.googleTagManagerKey')
if (!googleTagManagerKey && config.get('isProduction')) {
  logger.warn('Analytics googleTagManagerKey not set')
}

let viteManifest

export function context(request) {
  const adminUser = getAdminUser(request)
  const permissions = permissionsFor(adminUser)

  if (config.get('isProduction') && !viteManifest) {
    try {
      viteManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(`Vite ${path.basename(manifestPath)} not found`)
    }
  }

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    cookieName: config.get('cookieConsent.name'),
    googleTagManagerKey,
    breadcrumbs: [],
    navigation: buildNavigation(request, permissions),
    adminUser,
    permissions,
    getAssetPath(asset) {
      if (!config.get('isProduction')) {
        return `${assetPath}/${asset}`
      }

      const viteAssetPath = viteManifest?.[asset]?.file
      return `${assetPath}/${viteAssetPath ?? asset}`
    }
  }
}
