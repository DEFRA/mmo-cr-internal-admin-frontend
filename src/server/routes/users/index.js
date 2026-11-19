import Joi from 'joi'

import { listController } from './list/controller.js'
import {
  createController,
  createPostController,
  confirmationController
} from './create/controller.js'
import { profileController } from './profile/controller.js'
import { amendController, amendPostController } from './amend/controller.js'
import {
  deactivateController,
  deactivatePostController
} from './deactivate/controller.js'
import {
  reactivateController,
  reactivatePostController
} from './reactivate/controller.js'
import {
  addVesselController,
  addVesselPostController,
  removeVesselController,
  removeVesselPostController
} from './vessels/controller.js'
import { notesPostController } from './notes/controller.js'

const userParams = {
  params: Joi.object({ userId: Joi.string().pattern(/^\d+$/).required() })
}

const withUser = (method, path, controller) => ({
  method,
  path,
  ...controller,
  options: {
    ...controller.options,
    validate: { ...controller.options?.validate, ...userParams }
  }
})

export const users = {
  plugin: {
    name: 'users',
    register(server) {
      server.route([
        { method: 'GET', path: '/users', ...listController },
        { method: 'GET', path: '/users/create', ...createController },
        { method: 'POST', path: '/users/create', ...createPostController },
        withUser(
          'GET',
          '/users/create/confirmation/{userId}',
          confirmationController
        ),
        withUser('GET', '/users/{userId}', profileController),
        withUser('GET', '/users/{userId}/amend', amendController),
        withUser('POST', '/users/{userId}/amend', amendPostController),
        withUser('GET', '/users/{userId}/deactivate', deactivateController),
        withUser(
          'POST',
          '/users/{userId}/deactivate',
          deactivatePostController
        ),
        withUser('GET', '/users/{userId}/reactivate', reactivateController),
        withUser(
          'POST',
          '/users/{userId}/reactivate',
          reactivatePostController
        ),
        withUser('GET', '/users/{userId}/vessels/add', addVesselController),
        withUser(
          'POST',
          '/users/{userId}/vessels/add',
          addVesselPostController
        ),
        withUser(
          'GET',
          '/users/{userId}/vessels/remove',
          removeVesselController
        ),
        withUser(
          'POST',
          '/users/{userId}/vessels/remove',
          removeVesselPostController
        ),
        withUser('POST', '/users/{userId}/notes', notesPostController)
      ])
    }
  }
}
