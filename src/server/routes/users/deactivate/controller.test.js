import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#deactivateUser', () => {
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

  test('Should ask for confirmation', async () => {
    const $ = load((await agent.get('/users/1236/deactivate')).result)

    expect($('h1').text()).toBe('Deactivate Paul Smith?')
    expect($('.govuk-back-link').text()).toBe('Back to Paul Smith’s profile')
    expect($('.govuk-summary-list').text()).toContain('Invited')
  })

  test('Should deactivate the user and offer reactivation', async () => {
    const response = await agent.post('/users/1236/deactivate')
    const $ = load((await agent.get(response.headers.location)).result)

    expect($('h1').text()).toBe('Paul Smith')
    expect($('[data-testid="app-success-banner"]').text()).toContain(
      'Paul Smith can no longer access the service. Their records have been kept.'
    )
    expect($('.govuk-tag').first().text().trim()).toBe('Deactivated')
    expect($('a[href="/users/1236/reactivate"]').text()).toBe('Reactivate user')
  })

  test('Should send already deactivated users back to their profile', async () => {
    await agent.post('/users/1236/deactivate')
    const { headers } = await agent.get('/users/1236/deactivate')

    expect(headers.location).toBe('/users/1236')
  })
})
