import { listController, exportController } from './controller.js'

export const tripBreakdown = {
  plugin: {
    name: 'trip-breakdown',
    register(server) {
      server.route([
        { method: 'GET', path: '/trip-breakdown', ...listController },
        { method: 'GET', path: '/trip-breakdown/export', ...exportController }
      ])
    }
  }
}
