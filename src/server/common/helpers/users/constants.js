export const USER_STATUSES = [
  { value: 'created', text: 'Created', tagClass: 'govuk-tag--grey' },
  { value: 'invited', text: 'Invited', tagClass: 'govuk-tag--pink' },
  { value: 'accepted', text: 'Accepted', tagClass: 'govuk-tag--teal' },
  { value: 'deactivated', text: 'Deactivated', tagClass: 'govuk-tag--grey' }
]

// Order used by the create/amend select (matches the design)
export const ADMINISTRATIONS = [
  'England',
  'Wales',
  'Scotland',
  'Northern Ireland',
  'Isle of Man'
]

// Order used by the Users list filter panel (matches the design)
export const ADMINISTRATION_FILTER_ORDER = [
  'England',
  'Northern Ireland',
  'Scotland',
  'Wales',
  'Isle of Man'
]

export const VESSEL_ROLES = ['Owner (Nominee)', 'Skipper (Master)']

export const USERS_PAGE_SIZE = 10
