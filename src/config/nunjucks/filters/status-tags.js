import {
  TRIP_STATUSES,
  VESSEL_STATUSES
} from '#/server/common/helpers/vessels/constants.js'
import { SUBMISSION_METHODS } from '#/server/common/helpers/trips/constants.js'

const toTag = (statuses, status) => {
  const match = statuses.find((item) => item.value === status)
  return {
    text: match?.text ?? status,
    classes: match?.tagClass ?? 'govuk-tag--grey'
  }
}

// govukTag params, e.g. {{ govukTag(vessel.status | vesselStatusTag) }}
export const vesselStatusTag = (status) => toTag(VESSEL_STATUSES, status)
export const tripStatusTag = (status) => toTag(TRIP_STATUSES, status)
export const submissionMethodTag = (method) => toTag(SUBMISSION_METHODS, method)
