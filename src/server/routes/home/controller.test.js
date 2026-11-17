import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should redirect to sign in when not signed in', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe('/sign-in')
  })

  test('Should list the back-office sections and preview roles', async () => {
    const agent = await createAgent(server).signIn()
    const { result, statusCode } = await agent.get('/')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect($('h1').text()).toBe('Web Administration Portal')
    expect($('[data-testid="app-gov-header"]').text()).toContain(
      'Web Admin Portal'
    )
    expect($('body').hasClass('app-font-gds-transport')).toBe(true)
    expect($('footer .govuk-footer a[href="/clear-data"]').text().trim()).toBe(
      'Clear data'
    )
    const usersLink = $('[data-testid="portal-sections"] a[href="/users"]')

    // As in the prototype, portal home links open in a new tab
    expect(usersLink.text()).toBe('Users (opens in new tab)')
    expect(usersLink.attr('target')).toBe('_blank')
    expect($('[data-testid="portal-roles"] tbody tr')).toHaveLength(8)
  })

  test('Should reset the mock data when Clear data is used', async () => {
    const agent = await createAgent(server).signIn()
    await agent.post('/users/1235/notes', { note: 'A note to clear' })

    const { headers } = await agent.get('/clear-data')
    const { result } = await agent.get('/users/1235')

    expect(headers.location).toBe('/')
    expect(result).not.toContain('A note to clear')
  })

  test('Should switch the previewed role', async () => {
    const agent = await createAgent(server).signIn()

    const { headers } = await agent.get('/role-preview/helpline')
    const { result } = await agent.get('/users')

    expect(headers.location).toBe('/users')
    expect(result).toContain('Role: Helpline Team')
  })
})
