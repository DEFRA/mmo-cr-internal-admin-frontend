import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#signIn', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should redirect admin pages to sign in when signed out', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/users'
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe('/sign-in')
  })

  test('Should show both errors when submitted empty', async () => {
    const agent = createAgent(server)
    const { result } = await agent.post('/sign-in', { email: '', password: '' })
    const $ = load(result)

    expect(
      $('.govuk-error-summary__list a')
        .map((_i, el) => $(el).text())
        .get()
    ).toEqual(['Enter your email address', 'Enter your password'])
    expect($('title').text()).toContain('Error: Sign in')
  })

  test('Should sign in with any email and password, then sign out', async () => {
    const agent = createAgent(server)
    const signedIn = await agent.post('/sign-in', {
      email: 'someone@example.test',
      password: 'anything'
    })
    const users = await agent.get('/users')

    expect(signedIn.headers.location).toBe('/')
    expect(users.statusCode).toBe(statusCodes.ok)
    expect(users.result).toContain('Sam Smith')

    const signedOut = await agent.get('/sign-out')
    const afterSignOut = await agent.get('/users')

    expect(signedOut.headers.location).toBe('/sign-in')
    expect(afterSignOut.headers.location).toBe('/sign-in')
  })

  test('Should send signed-in users from sign in to the portal home', async () => {
    const agent = await createAgent(server).signIn()
    const { headers } = await agent.get('/sign-in')

    expect(headers.location).toBe('/')
  })
})
