import { listController } from './controller.js'

export const auditLog = {
  plugin: {
    name: 'audit-log',
    register(server) {
      server.route({ method: 'GET', path: '/audit-log', ...listController })
    }
  }
}
