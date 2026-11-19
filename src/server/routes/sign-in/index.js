import { signInController, signInPostController } from './controller.js'

export const signIn = {
  plugin: {
    name: 'sign-in',
    register(server) {
      server.route([
        { method: 'GET', path: '/sign-in', ...signInController },
        { method: 'POST', path: '/sign-in', ...signInPostController }
      ])
    }
  }
}
