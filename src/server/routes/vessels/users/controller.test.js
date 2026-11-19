import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const summaryErrors = ($) =>
  $('.govuk-error-summary__list a')
    .map((_i, el) => $(el).text())
    .get()

describe('#vesselUsers', () => {
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

  test('Should only offer users who are not already linked', async () => {
    const $ = load((await agent.get('/vessels/lady-jane/users/add')).result)

    expect($('h1').text()).toBe('Add a user to Lady Jane')
    expect($('.govuk-caption-l').text()).toBe('Vessel PZ1')
    expect($('#user-id option[value="1234"]')).toHaveLength(0)
    expect($('#user-id option[value="1235"]').text()).toBe('Joe Bloggs (1235)')
  })

  test('Should require a user and a role', async () => {
    const { result } = await agent.post('/vessels/lady-jane/users/add')

    expect(summaryErrors(load(result))).toEqual([
      'Select a user',
      'Select a user role'
    ])
  })

  test('Should link a user, then remove them, updating both profiles', async () => {
    const added = await agent.post('/vessels/lady-jane/users/add', {
      'user-id': '1235',
      role: 'Skipper (Master)'
    })
    const vessel = load((await agent.get('/vessels/lady-jane')).result)
    const user = load((await agent.get('/users/1235')).result)

    expect(added.headers.location).toBe('/vessels/lady-jane#users')
    expect(vessel('[data-testid="app-success-banner"]').text()).toContain(
      'User added to vessel'
    )
    expect(vessel('[data-testid="vessel-users"]').text()).toContain(
      'Joe Bloggs'
    )
    expect(user('[data-testid="user-vessels"]').text()).toContain('Lady Jane')

    const removeForm = load(
      (await agent.get('/vessels/lady-jane/users/remove')).result
    )
    expect(removeForm('label[for="user-id-2"]').text().trim()).toBe(
      'Joe Bloggs (Skipper (Master), user ID 1235)'
    )

    await agent.post('/vessels/lady-jane/users/remove', { 'user-id': '1235' })
    const after = load((await agent.get('/vessels/lady-jane')).result)

    expect(after('[data-testid="app-success-banner"]').text()).toContain(
      'User removed from vessel'
    )
    expect(after('[data-testid="vessel-users"]').text()).not.toContain(
      'Joe Bloggs'
    )
    expect(
      after('[data-testid="vessel-history"] tbody tr').first().text()
    ).toContain('Vessel removed from user')
  })

  test('Should require a user to remove', async () => {
    const { result } = await agent.post('/vessels/lady-jane/users/remove')

    expect(summaryErrors(load(result))).toEqual(['Select a user'])
  })

  test('Should explain when no users are linked', async () => {
    const $ = load((await agent.get('/vessels/bubbles/users/remove')).result)

    expect($('[data-testid="no-users-to-remove"]').text()).toBe(
      'There are no users linked to this vessel.'
    )
    expect($('a.govuk-button').text().trim()).toBe('Return to vessel')
  })
})
