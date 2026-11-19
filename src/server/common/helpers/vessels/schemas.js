import Joi from 'joi'

import { VESSEL_ROLES } from '../users/constants.js'

const choose = (values, message) =>
  Joi.string()
    .valid(...values)
    .required()
    .messages({
      'any.required': message,
      'any.only': message,
      'string.empty': message
    })

export function addVesselUserSchema(userIds) {
  return Joi.object({
    'user-id': choose(userIds, 'Select a user'),
    role: choose(VESSEL_ROLES, 'Select a user role')
  })
}

export function removeVesselUserSchema(userIds) {
  return Joi.object({
    'user-id': choose(userIds, 'Select a user')
  })
}
