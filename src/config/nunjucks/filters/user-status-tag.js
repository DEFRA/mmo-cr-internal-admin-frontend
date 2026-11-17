import { USER_STATUSES } from '#/server/common/helpers/users/constants.js'

/**
 * Returns govukTag params for a user status, e.g. {{ govukTag(user.status | userStatusTag) }}
 */
export function userStatusTag(status) {
  const match = USER_STATUSES.find((item) => item.value === status)

  return {
    text: match?.text ?? status,
    classes: match?.tagClass ?? 'govuk-tag--grey'
  }
}
