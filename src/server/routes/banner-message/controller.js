import Joi from 'joi'

import {
  getStore,
  saveStore
} from '#/server/common/helpers/admin-store/admin-store.js'
import { flashBanner, takeBanner } from '#/server/common/helpers/banner.js'
import { validateForm } from '#/server/common/helpers/forms/validation.js'

const PATH = '/banner-message'

const messageSchema = Joi.object({
  'service-message': Joi.string().trim().allow('').max(2000).default('')
})

export const bannerMessageController = {
  handler(request, h) {
    const { serviceMessage } = getStore(request)

    return h.view('banner-message/index', {
      pageTitle: 'Banner message',
      banner: takeBanner(request),
      currentMessage: serviceMessage.current,
      // As in the prototype, the form keeps the last message saved
      newMessage: serviceMessage.lastSaved
    })
  }
}

// An empty message is ignored and the current message kept, as in the prototype
export const saveBannerMessageController = {
  handler(request, h) {
    const { values, errors } = validateForm(messageSchema, request.payload)
    const text = values?.['service-message']

    if (!errors && text) {
      const store = getStore(request)
      store.serviceMessage = { current: text, lastSaved: text }
      saveStore(request, store)
      flashBanner(request, {
        title: 'Service message updated',
        classes: 'app-success-banner--padded'
      })
    }

    return h.redirect(PATH)
  }
}
