import {
  bannerMessageController,
  saveBannerMessageController
} from './controller.js'

export const bannerMessage = {
  plugin: {
    name: 'banner-message',
    register(server) {
      server.route([
        { method: 'GET', path: '/banner-message', ...bannerMessageController },
        {
          method: 'POST',
          path: '/banner-message',
          ...saveBannerMessageController
        }
      ])
    }
  }
}
