import Joi from 'joi'

import { listController, exportController } from './list/controller.js'
import { profileController } from './profile/controller.js'
import {
  addUserController,
  addUserPostController,
  removeUserController,
  removeUserPostController
} from './users/controller.js'
import { notesPostController } from './notes/controller.js'

const vesselParams = Joi.object({
  vesselId: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .required()
})

const withVessel = (method, path, controller) => ({
  method,
  path,
  ...controller,
  options: {
    ...controller.options,
    validate: { ...controller.options?.validate, params: vesselParams }
  }
})

export const vessels = {
  plugin: {
    name: 'vessels',
    register(server) {
      server.route([
        { method: 'GET', path: '/vessels', ...listController },
        { method: 'GET', path: '/vessels/export', ...exportController },
        withVessel('GET', '/vessels/{vesselId}', profileController),
        withVessel('GET', '/vessels/{vesselId}/users/add', addUserController),
        withVessel(
          'POST',
          '/vessels/{vesselId}/users/add',
          addUserPostController
        ),
        withVessel(
          'GET',
          '/vessels/{vesselId}/users/remove',
          removeUserController
        ),
        withVessel(
          'POST',
          '/vessels/{vesselId}/users/remove',
          removeUserPostController
        ),
        withVessel('POST', '/vessels/{vesselId}/notes', notesPostController)
      ])
    }
  }
}
