import { readFileSync } from 'node:fs'

const SESSION_KEY = 'adminStore'

// Bump when the seed data shape changes so older session copies are reseeded
const STORE_VERSION = 6

const seedUrl = (file) =>
  new URL(`../../mock-data/admin/${file}`, import.meta.url)

const seed = Object.freeze({
  users: JSON.parse(readFileSync(seedUrl('users.json'), 'utf-8')),
  vessels: JSON.parse(readFileSync(seedUrl('vessels.json'), 'utf-8')),
  trips: JSON.parse(readFileSync(seedUrl('trips.json'), 'utf-8')),
  serviceMessage: JSON.parse(
    readFileSync(seedUrl('service-message.json'), 'utf-8')
  )
})

export function createSeedStore() {
  return { version: STORE_VERSION, ...structuredClone(seed) }
}

/**
 * Mock data lives in the user's session so each walkthrough starts from the
 * seed data and changes never leak between sessions. See docs/adr/0001.
 */
export function getStore(request) {
  const stored = request.yar.get(SESSION_KEY)
  return stored?.version === STORE_VERSION ? stored : createSeedStore()
}

export function saveStore(request, store) {
  request.yar.set(SESSION_KEY, store)
}

export function resetStore(request) {
  request.yar.clear(SESSION_KEY)
}
