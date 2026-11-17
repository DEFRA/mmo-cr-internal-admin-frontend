import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const summaryKeys = ($) =>
  $('.govuk-summary-list__key')
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#userProfile', () => {
  let server
  let agent

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(async () => {
    agent = await createAgent(server).signIn()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should show the user details, actions and tabs', async () => {
    const { result, statusCode } = await agent.get('/users/1235')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect($('h1').text()).toBe('Joe Bloggs')
    expect(summaryKeys($)).toEqual([
      'Full name',
      'User ID',
      'Email address',
      'Phone number',
      'Postal address',
      'Administration',
      'Status'
    ])
    expect($('a[href="/users/1235/deactivate"]').text()).toBe('Deactivate user')
    expect(
      $('.govuk-tabs__tab')
        .map((_i, el) => $(el).text().trim())
        .get()
    ).toEqual(['Vessels', 'Fishing trips', 'History', 'Notes'])
    expect($('[data-testid="user-history"] tbody tr')).toHaveLength(2)
  })

  test('Should show "Not provided" for missing details and linked vessels', async () => {
    const paul = load((await agent.get('/users/1236')).result)
    const john = load((await agent.get('/users/1234')).result)

    expect(paul('.govuk-summary-list').text()).toContain('Not provided')
    expect(john('[data-testid="user-vessels"] tbody').text()).toContain(
      'Lady Jane'
    )
  })

  test('Should return not found for an unknown user', async () => {
    const { statusCode } = await agent.get('/users/9999')

    expect(statusCode).toBe(statusCodes.notFound)
  })
})
