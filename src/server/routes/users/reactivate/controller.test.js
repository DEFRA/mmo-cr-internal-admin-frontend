import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#reactivateUser', () => {
  let server
  let agent

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(async () => {
    agent = await createAgent(server).signIn()
    await agent.post('/users/1236/deactivate')
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should link a deactivated user to a confirmation page', async () => {
    const profile = load((await agent.get('/users/1236')).result)
    const { result, statusCode } = await agent.get('/users/1236/reactivate')
    const $ = load(result)

    expect(profile('a[href="/users/1236/reactivate"]').text()).toBe(
      'Reactivate user'
    )
    expect(statusCode).toBe(statusCodes.ok)
    expect($('h1').text()).toContain('Reactivate Paul Smith?')
    expect($('.govuk-summary-list').text()).toContain('Deactivated')
    expect($('a.govuk-button--secondary').attr('href')).toBe('/users/1236')
  })

  test('Should restore the previous status, confirm and record the change', async () => {
    const { statusCode, headers } = await agent.post('/users/1236/reactivate')
    const $ = load((await agent.get('/users/1236')).result)

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe('/users/1236')
    expect($('[data-testid="app-success-banner"]').text()).toContain(
      'Paul Smith can access the service again.'
    )
    expect($('.govuk-tag').first().text().trim()).toBe('Invited')
    expect($('#history tbody tr').first().text()).toContain('User reactivated')
  })

  test('Should send an active user back to their profile', async () => {
    const { statusCode, headers } = await agent.get('/users/1235/reactivate')

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe('/users/1235')
  })
})
