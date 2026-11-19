import Joi from 'joi'

import { validateForm } from '#/server/common/helpers/forms/validation.js'
import {
  getAdminUser,
  signIn
} from '#/server/common/helpers/admin-auth/admin-user.js'

const VIEW = 'sign-in/index'

const required = (message) =>
  Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': message, 'string.empty': message })

// Mock sign-in: any non-empty email address and password are accepted (ADR 0001)
const signInSchema = Joi.object({
  email: required('Enter your email address'),
  password: required('Enter your password')
})

export const signInController = {
  handler(request, h) {
    if (getAdminUser(request)) {
      return h.redirect('/')
    }

    return h.view(VIEW, { pageTitle: 'Sign in' })
  }
}

export const signInPostController = {
  handler(request, h) {
    const { values, errors } = validateForm(signInSchema, request.payload, [
      'email',
      'password'
    ])

    if (errors) {
      return h.view(VIEW, {
        pageTitle: 'Sign in',
        values: { email: values.email },
        ...errors
      })
    }

    signIn(request)
    return h.redirect('/')
  }
}
