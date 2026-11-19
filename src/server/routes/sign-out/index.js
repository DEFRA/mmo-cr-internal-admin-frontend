export const signOut = {
  plugin: {
    name: 'sign-out',
    register(server) {
      server.route({
        method: 'GET',
        path: '/sign-out',
        handler(request, h) {
          request.yar.reset()
          return h.redirect('/sign-in')
        }
      })
    }
  }
}
