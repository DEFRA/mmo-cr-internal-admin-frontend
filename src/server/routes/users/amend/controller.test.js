import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

describe('#amendUser', () => {
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

  test('Should pre-fill the form without the assisted digital question', async () => {
    const $ = load((await agent.get('/users/1235/amend')).result)

    expect($('#full-name').val()).toBe('Joe Bloggs')
    expect($('#administration option[selected]').val()).toBe('Wales')
    expect($('input[name="assisted-digital"]')).toHaveLength(0)
  })

  test('Should show errors for cleared required fields', async () => {
    const { result } = await agent.post('/users/1235/amend', {
      'full-name': '',
      'email-address': 'Joe.Bloggs@email.com',
      'address-line-1': '',
      'address-town-city': 'Milford Haven',
      'address-postcode': '',
      administration: 'Wales'
    })
    const $ = load(result)

    expect(
      $('.govuk-error-summary__list a')
        .map((_i, el) => $(el).text())
        .get()
    ).toEqual([
      'Enter a full name or company name',
      'Enter the first line of the address',
      'Enter a postcode'
    ])
  })

  test('Should save changes and show the updated banner once', async () => {
    const saved = await agent.post('/users/1235/amend', {
      'full-name': 'Joseph Bloggs',
      'email-address': 'Joe.Bloggs@email.com',
      'telephone-number': '07700900123',
      'address-line-1': '3 Example Road',
      'address-town-city': 'Milford Haven',
      'address-postcode': 'SA73 0XX',
      administration: 'Wales'
    })
    const profile = load((await agent.get(saved.headers.location)).result)
    const again = load((await agent.get('/users/1235')).result)

    expect(saved.headers.location).toBe('/users/1235')
    expect(profile('h1').text()).toBe('Joseph Bloggs')
    expect(profile('[data-testid="app-success-banner"]').text()).toContain(
      'User details updated'
    )
    expect(profile('[data-testid="user-history"]').text()).toContain(
      'User details amended'
    )
    expect(again('[data-testid="app-success-banner"]')).toHaveLength(0)
  })
})
