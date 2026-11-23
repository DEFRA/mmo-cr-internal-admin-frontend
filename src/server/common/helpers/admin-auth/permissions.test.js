import { load } from 'cheerio'

import { createServer } from '#/server/server.js'
import { statusCodes } from '#/server/common/constants/status-codes.js'
import { createAgent } from '#/test-helpers/admin-agent.js'

const navItems = ($) =>
  $('.app-admin-header__nav-item')
    .map((_i, el) => $(el).text().trim())
    .get()

describe('#rolePermissions', () => {
  let server
  let agent

  const asRole = async (key) => {
    await agent.get(`/role-preview/${key}`)
    return agent
  }

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

  test('Should show every section to a Service Manager', async () => {
    const $ = load((await agent.get('/users')).result)

    expect(navItems($)).toEqual([
      'Users',
      'Vessels',
      'Fishing trips',
      'Trip breakdown',
      'Audit log',
      'Banner message'
    ])
  })

  test('Should hide and block sections a role cannot use', async () => {
    await asRole('fishing-vessel-licensing')
    const $ = load((await agent.get('/users')).result)
    const blocked = await agent.get('/trip-breakdown')
    const auditLog = await agent.get('/audit-log')

    expect(navItems($)).toEqual(['Users', 'Vessels', 'Fishing trips'])
    expect(blocked.statusCode).toBe(statusCodes.found)
    expect(blocked.headers.location).toBe('/users')
    expect(auditLog.headers.location).toBe('/users')
  })

  test('Should let Compliance export vessel data but not create users', async () => {
    await asRole('compliance')
    const users = load((await agent.get('/users')).result)
    const vessels = load((await agent.get('/vessels')).result)
    const create = await agent.get('/users/create')

    expect(users('a:contains("Create a new user")')).toHaveLength(0)
    expect(vessels('a:contains("Export vessel data")')).toHaveLength(1)
    expect(create.headers.location).toBe('/users')
  })

  test('Should let Full Ops amend catch but not Compliance with Licensing', async () => {
    const tripPath = '/fishing-trips/C34245202608171402'

    await asRole('full-ops')
    const fullOps = load((await agent.get(tripPath)).result)
    await asRole('compliance-with-licensing')
    const cwl = load((await agent.get(tripPath)).result)

    expect(fullOps('a:contains("Amend catch recording")')).toHaveLength(1)
    expect(cwl('a:contains("Amend catch recording")')).toHaveLength(0)
    expect(cwl('a:contains("Download PDF")').length).toBeGreaterThan(0)
    expect(cwl('a:contains("View all history")')).toHaveLength(0)
  })

  test('Should limit FDST to skipper links', async () => {
    await asRole('fdst')
    const add = load((await agent.get('/users/1234/vessels/add')).result)
    const remove = load((await agent.get('/users/1234/vessels/remove')).result)

    expect(
      add('select[name="role"] option')
        .map((_i, el) => add(el).val())
        .get()
    ).toEqual(['Skipper (Master)'])
    expect(remove('select[name="vessel"]')).toHaveLength(0)

    await agent.post('/users/1234/vessels/add', {
      vessel: 'quatro',
      role: 'Owner (Nominee)'
    })
    const profile = load((await agent.get('/users/1234')).result)

    expect(profile('[data-testid="user-vessels"]').text()).toContain(
      'Skipper (Master)'
    )
  })

  test('Should hide the user notes form from Other Operations', async () => {
    await asRole('other-operations')
    const $ = load((await agent.get('/users/1234')).result)

    expect($('textarea[name="note"]')).toHaveLength(0)
  })
})
