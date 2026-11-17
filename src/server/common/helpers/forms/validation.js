/**
 * Turns a Joi validation error into GOV.UK error summary items and per-field
 * messages. `order` controls the error summary order to match the designs.
 */
export function formatValidationErrors(error, order = []) {
  if (!error) {
    return null
  }

  const fieldErrors = {}
  for (const detail of error.details) {
    const field = detail.path[0]
    fieldErrors[field] ??= detail.message
  }

  const rank = (field) => {
    const index = order.indexOf(field)
    return index === -1 ? order.length : index
  }

  const errorList = Object.keys(fieldErrors)
    .sort((a, b) => rank(a) - rank(b))
    .map((field) => ({ text: fieldErrors[field], href: `#${field}` }))

  return { errorList, fieldErrors }
}

export function validateForm(schema, payload, order) {
  const { value, error } = schema.validate(payload ?? {}, {
    abortEarly: false,
    stripUnknown: true
  })

  return { values: value, errors: formatValidationErrors(error, order) }
}

export function toArray(value) {
  if (value === undefined || value === null || value === '') {
    return []
  }
  return Array.isArray(value) ? value : [value]
}
