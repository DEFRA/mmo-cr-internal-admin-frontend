import Joi from 'joi'

import { exportController, listController } from './list/controller.js'
import { profileController } from './profile/controller.js'
import { versionsController } from './versions/controller.js'
import { notesPostController } from './notes/controller.js'

const tripParams = Joi.object({
  tripId: Joi.string()
    .pattern(/^[A-Z0-9]+$/)
    .required()
})

const withTrip = (method, path, controller) => ({
  method,
  path,
  ...controller,
  options: {
    ...controller.options,
    validate: { ...controller.options?.validate, params: tripParams }
  }
})

export const fishingTrips = {
  plugin: {
    name: 'fishing-trips',
    register(server) {
      server.route([
        { method: 'GET', path: '/fishing-trips', ...listController },
        {
          method: 'GET',
          path: '/fishing-trips/export',
          ...exportController
        },
        withTrip('GET', '/fishing-trips/{tripId}', profileController),
        withTrip('GET', '/fishing-trips/{tripId}/versions', versionsController),
        withTrip('POST', '/fishing-trips/{tripId}/notes', notesPostController)
      ])
    }
  }
}
