import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const names = ($) =>
  $('[data-testid="users-table"] tbody tr td:first-child')
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#usersList', () => {
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

  test('Should show the first page of users with pagination', async () => {
    const { result, statusCode } = await agent.get('/users')
    const $ = load(result)

    expect(statusCode).toBe(statusCodes.ok)
    expect(names($)).toHaveLength(10)
    expect(names($)[0]).toBe('Joe Bloggs')
    expect($('.govuk-pagination__link[href="/users?page=2"]')).toHaveLength(2)
  })

  test('Should search by name, email or telephone', async () => {
    const byName = load((await agent.get('/users?s=smith')).result)
    const byPhone = load((await agent.get('/users?s=7700900105')).result)

    expect(names(byName)).toEqual(['Paul Smith', 'John Smith'])
    expect(names(byPhone)).toEqual(['Noah Evans'])
  })

  test('Should hide deactivated users unless searched for or filtered', async () => {
    await agent.post('/users/1243/deactivate')

    const all = load((await agent.get('/users?page=1')).result)
    const page2 = load((await agent.get('/users?page=2')).result)
    const searched = load((await agent.get('/users?s=liam')).result)
    const filtered = load((await agent.get('/users?status=deactivated')).result)

    expect([...names(all), ...names(page2)]).not.toContain('Liam Baker')
    expect(names(searched)).toEqual(['Liam Baker'])
    expect(names(filtered)).toEqual(['Liam Baker'])
  })

  test('Should combine filters and keep them checked', async () => {
    const { result } = await agent.get(
      '/users?assisted-digital=yes&administration=England'
    )
    const $ = load(result)

    expect(names($)).toEqual(['Olivia Roberts', 'Abigail Bailey'])
    expect(
      $('input[name="assisted-digital"][value="yes"]').attr('checked')
    ).toBeDefined()
  })

  test('Should show an empty message when nothing matches', async () => {
    const { result } = await agent.get('/users?s=zzzz')

    expect(load(result)('[data-testid="users-empty"]').text()).toBe(
      'No users found.'
    )
  })

  test('Should ignore invalid filter values', async () => {
    const { headers } = await agent.get('/users?status=unknown')

    expect(headers.location).toBe('/users')
  })
})
