import {
  archiveController,
  optionOneController,
  optionTwoController,
  optionThreeController
} from './controller.js'

export const tripLayouts = {
  plugin: {
    name: 'trip-layouts',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/trip-layouts/archive',
          ...archiveController
        },
        {
          method: 'GET',
          path: '/trip-layouts/option-1',
          ...optionOneController
        },
        {
          method: 'GET',
          path: '/trip-layouts/option-2',
          ...optionTwoController
        },
        {
          method: 'GET',
          path: '/trip-layouts/option-3',
          ...optionThreeController
        }
      ])
    }
  }
}
