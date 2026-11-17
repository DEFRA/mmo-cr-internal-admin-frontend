import { placeholderController } from './controller.js'

// Visible destinations that belong to later implementation phases
const placeholderRoutes = [
  { path: '/fishing-trips/{tripId}/amend', heading: 'Amend catch recording' },
  { path: '/fishing-trips/{tripId}/pdf', heading: 'Download PDF' },
  {
    path: '/users/{userId}/access-catch-recording',
    heading: 'Access catch recording'
  }
]

export const placeholder = {
  plugin: {
    name: 'placeholder',
    register(server) {
      server.route(
        placeholderRoutes.map(({ path, heading }) => ({
          method: 'GET',
          path,
          options: { app: { heading } },
          ...placeholderController
        }))
      )
    }
  }
}
