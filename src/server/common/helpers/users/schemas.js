import Joi from 'joi'

import { ADMINISTRATIONS, VESSEL_ROLES } from './constants.js'

const requiredText = (message) =>
  Joi.string()
    .trim()
    .required()
    .messages({ 'any.required': message, 'string.empty': message })

const optionalText = () => Joi.string().trim().allow('').default('')

// Error summary order shown in the designs (U2a / U7a)
export const USER_FIELD_ORDER = [
  'full-name',
  'assisted-digital',
  'address-line-1',
  'address-town-city',
  'address-postcode',
  'email-address',
  'administration'
]

/**
 * Schema for the create and amend user forms. The assisted digital question
 * is only asked on create; on amend the user's stored answer decides whether
 * an email address is required.
 */
export function userDetailsSchema({ askAssistedDigital, assistedDigital }) {
  const emailMessage = 'Enter an email address'
  const optionalEmail = Joi.string().trim().allow('').default('')
  const requiredEmail = requiredText(emailMessage)

  let email
  if (askAssistedDigital) {
    email = Joi.when('assisted-digital', {
      is: 'yes',
      then: optionalEmail,
      otherwise: requiredEmail
    })
  } else {
    email = assistedDigital === 'yes' ? optionalEmail : requiredEmail
  }

  const keys = {
    'full-name': requiredText('Enter a full name or company name'),
    'email-address': email,
    'telephone-number': optionalText(),
    'address-line-1': requiredText('Enter the first line of the address'),
    'address-line-2': optionalText(),
    'address-town-city': requiredText('Enter a town or city'),
    'address-postcode': requiredText('Enter a postcode'),
    administration: Joi.string()
      .valid(...ADMINISTRATIONS)
      .required()
      .messages({
        'any.required': 'Select an administration',
        'any.only': 'Select an administration',
        'string.empty': 'Select an administration'
      })
  }

  if (askAssistedDigital) {
    keys['assisted-digital'] = Joi.string()
      .valid('yes', 'no')
      .required()
      .messages({
        'any.required':
          'Select whether the user needs assisted digital support',
        'any.only': 'Select whether the user needs assisted digital support'
      })
  }

  return Joi.object(keys)
}

export function addVesselSchema(vesselIds) {
  return Joi.object({
    vessel: Joi.string()
      .valid(...vesselIds)
      .required()
      .messages({
        'any.required': 'Select a vessel',
        'any.only': 'Select a vessel',
        'string.empty': 'Select a vessel'
      }),
    role: Joi.string()
      .valid(...VESSEL_ROLES)
      .required()
      .messages({
        'any.required': 'Select a user role',
        'any.only': 'Select a user role',
        'string.empty': 'Select a user role'
      })
  })
}

export function removeVesselSchema(vesselIds) {
  return Joi.object({
    vessel: Joi.string()
      .valid(...vesselIds)
      .required()
      .messages({
        'any.required': 'Select a vessel',
        'any.only': 'Select a vessel',
        'string.empty': 'Select a vessel'
      })
  })
}

export const noteSchema = Joi.object({
  note: Joi.string().trim().allow('').max(2000).default('')
})
