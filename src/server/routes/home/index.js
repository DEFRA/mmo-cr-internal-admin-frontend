import { homeController, clearDataController } from './controller.js'

export const home = {
  plugin: {
    name: 'home',
    register(server) {
      server.route([
        { method: 'GET', path: '/', ...homeController },
        { method: 'GET', path: '/clear-data', ...clearDataController }
      ])
    }
  }
}
