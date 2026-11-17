import { ADMIN_ROLES } from '#/server/common/helpers/admin-auth/admin-user.js'
import { resetStore } from '#/server/common/helpers/admin-store/admin-store.js'

const sections = [
  {
    text: 'Users',
    href: '/users',
    description: 'Search, view and create user accounts.'
  },
  {
    text: 'Vessels',
    href: '/vessels',
    description: 'Search vessels and manage their linked users.'
  },
  {
    text: 'Fishing trips',
    href: '/fishing-trips',
    description: 'Search and view submitted fishing trips.',
    isParagraph: true
  },
  {
    text: 'Trip breakdown',
    href: '/trip-breakdown',
    description: 'Review catch entries across trips by species.',
    isParagraph: true
  },
  { isTripLayouts: true },
  {
    text: 'Audit log',
    href: '/audit-log',
    description: 'Review recorded user, vessel and trip activity.'
  },
  {
    text: 'Banner message',
    href: '/banner-message',
    description: 'View and update the service banner message.'
  }
]

/**
 * Portal home (back-office index).
 */
export const homeController = {
  handler(_request, h) {
    return h.view('home/index', {
      pageTitle: 'Web Administration Portal',
      sections,
      roles: ADMIN_ROLES
    })
  }
}

/**
 * Resets the session's mock data to the seed data (prototype "Clear data").
 */
export const clearDataController = {
  handler(request, h) {
    resetStore(request)
    return h.redirect('/')
  }
}
