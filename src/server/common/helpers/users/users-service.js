import { USER_STATUSES } from './constants.js'

const nowIso = () => new Date().toISOString()

const historyEntry = (action, actor) => ({
  dateTime: nowIso(),
  action,
  performedBy: actor.name
})

export function findUser(store, userId) {
  return store.users.find((user) => user.id === userId) ?? null
}

export function findVessel(store, vesselId) {
  return store.vessels.find((vessel) => vessel.id === vesselId) ?? null
}

export function statusLabel(status) {
  return USER_STATUSES.find((item) => item.value === status)?.text ?? status
}

/**
 * Deactivated users are hidden unless the search matches them or the
 * Deactivated status filter is selected (as described on the Users list).
 */
export function searchUsers(
  users,
  { s = '', status = [], assistedDigital = [], administration = [] } = {}
) {
  const term = s.trim().toLowerCase()
  const compact = (value) => value.replace(/\s+/g, '')

  return users.filter((user) => {
    const matchesSearch =
      !term ||
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.telephone && compact(user.telephone).includes(compact(term)))

    if (!matchesSearch) return false
    if (status.length && !status.includes(user.status)) return false
    if (!term && !status.length && user.status === 'deactivated') return false
    if (
      assistedDigital.length &&
      !assistedDigital.includes(user.assistedDigital)
    ) {
      return false
    }
    if (
      administration.length &&
      !administration.includes(user.administration)
    ) {
      return false
    }

    return true
  })
}

function nextUserId(store) {
  const highest = Math.max(...store.users.map((user) => Number(user.id)))
  return String(highest + 1)
}

function detailsFromForm(values) {
  return {
    fullName: values['full-name'],
    email: values['email-address'],
    telephone: values['telephone-number'],
    address: {
      line1: values['address-line-1'],
      line2: values['address-line-2'],
      town: values['address-town-city'],
      postcode: values['address-postcode']
    },
    administration: values.administration
  }
}

export function userToForm(user) {
  return {
    'full-name': user.fullName,
    'email-address': user.email,
    'telephone-number': user.telephone,
    'address-line-1': user.address.line1,
    'address-line-2': user.address.line2,
    'address-town-city': user.address.town,
    'address-postcode': user.address.postcode,
    administration: user.administration
  }
}

export function createUser(store, values, actor) {
  const createdOn = nowIso()
  const user = {
    id: nextUserId(store),
    ...detailsFromForm(values),
    status: 'invited',
    assistedDigital: values['assisted-digital'],
    channel: 'Web',
    createdOn,
    createdInPortal: true,
    invitationEmail: 'Sent (simulated)',
    vessels: [],
    history: [
      { dateTime: createdOn, action: 'User created', performedBy: actor.name }
    ],
    notes: []
  }

  store.users.unshift(user)
  return user
}

export function amendUser(user, values, actor) {
  Object.assign(user, detailsFromForm(values))
  user.history.unshift(historyEntry('User details amended', actor))
  return user
}

export function deactivateUser(user, actor) {
  user.statusBeforeDeactivation = user.status
  user.status = 'deactivated'
  user.history.unshift(historyEntry('User deactivated', actor))
  return user
}

// Restores the status the user had before they were deactivated
export function reactivateUser(user, actor) {
  user.status = user.statusBeforeDeactivation ?? 'accepted'
  delete user.statusBeforeDeactivation
  user.history.unshift(historyEntry('User reactivated', actor))
  return user
}

export function linkedVessels(store, user) {
  return user.vessels
    .map((link) => ({ ...link, vessel: findVessel(store, link.vesselId) }))
    .filter((link) => link.vessel)
}

export function availableVessels(store, user) {
  const linked = new Set(user.vessels.map((link) => link.vesselId))
  return store.vessels.filter((vessel) => !linked.has(vessel.id))
}

// Trips on this vessel created by this user record the link change too
function recordOnTrips(store, user, vesselId, action, actor) {
  store.trips
    .filter(
      (trip) => trip.vesselId === vesselId && trip.createdBy === user.fullName
    )
    .forEach((trip) => trip.history?.unshift(historyEntry(action, actor)))
}

export function addVesselToUser(store, user, vesselId, role, actor) {
  const vessel = findVessel(store, vesselId)
  user.vessels.push({ vesselId, role, linkedOn: nowIso() })
  user.history.unshift(historyEntry('Vessel added to user', actor))
  vessel.history?.unshift(historyEntry('Vessel added to user', actor))
  recordOnTrips(store, user, vesselId, 'Vessel added', actor)
  return user
}

export function removeVesselFromUser(store, user, vesselId, actor) {
  const vessel = findVessel(store, vesselId)
  user.vessels = user.vessels.filter((link) => link.vesselId !== vesselId)
  user.history.unshift(historyEntry('Vessel removed from user', actor))
  vessel.history?.unshift(historyEntry('Vessel removed from user', actor))
  recordOnTrips(store, user, vesselId, 'Vessel removed', actor)
  return user
}

export function addNote(user, text, actor) {
  user.notes.unshift({
    author: actor.name,
    role: actor.role,
    dateTime: nowIso(),
    text
  })
  return user
}
